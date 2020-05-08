<template>
    <div ref="div" :id="id" class="blocks_js_editor" tabindex="-1"
        @mousemove="onMouseMove($event)"
        @mousedown="onMouseDown($event)"
        @mousewheel.prevent="onMouseWheel($event)"
        @keydown="onKeyDown($event)"
        @DOMMouseScroll.prevent="onMouseWheel($event)">
        <!-- @mousewheel for all brothers except Firefox, which needs @DOMMouseScroll - tabindex is to allow focus for delete keystroke etc -->
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" class="canvas">
            <Edge v-for="edge in edges" ref="edges" :key="edge.id"
                v-bind="edge" :state="state"
                :parameter1="edge.parameter1"
                :parameter2="edge.parameter2" />
            <line v-if="linkingLine" v-bind="linkingLine" />
        </svg>
        <div class="blocks">
            <Block v-for="block in pgParameterBlocks" ref="pgParameters" :key="block.id" :state="state" v-model="block.value" v-bind="block" />
            <Block v-for="block in blocks" ref="blocks" :key="block.id" :state="state" v-model="block.value" v-bind="block" />
        </div>
    </div>
</template>

<script>
import Block from './Block.vue';
import Edge from './Edge.vue';
import Utils from '../../utils.js';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import { JsonSchemaValidator, ProcessGraph, ProcessRegistry } from '@openeo/js-processgraphs';
import Vue from 'vue';

/*
Events:

Emits:
- error(message, title = null): Show error message
- showProcess(id): Show process by id
- showCollection(id): Show collection by id
- showSchema(name, schema): Show JSON schema
- editParameters(parameters, values, title = "Edit", isEditable = true, selectParameterName = null, saveCallback(data) = null, processId = null): Show the parameter editor
- compactMode(enable): Informs about the current state of compact mode.

- blocks.startDrag (to be removed)
*/

const getDefaultState = function(blocks) {
    return Vue.observable({
        root: blocks,
        editable: false,
        compactMode: false,
        moving: null, // Is the user dragging the view ?
        center: [0,0],
        mouse: [0,0],
        scale: 1.3,
        linkFrom: null, // Array
        linkTo: null // Array
    });
};
const selectionChangeWatcher = {
    immediate: true,
    handler() {
        this.$emit('selectionChanged', this.selectedBlocks, this.selectedEdges);
    }
};
const historySize = 30;

export default {
    name: 'Blocks',
    mixins: [EventBusMixin],
    components: {
        Block,
        Edge
    },
    props: {
        id: {
            type: String,
            required: true
        },
        editable: {
            type: Boolean,
            default: false
        },
        value: {
            type: Object,
            default: {},
        },
        collections: {
            type: Array,
            default: () => []
        },
        processes: {
            type: Array | Object,
            default: () => []
        },
        pgParameters: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            // Current offset for block that are generated without specific coordinates so that not all block occur on the same position
            newBlockOffset: 0,

            // History
            history: [],
            historyEnabled: false,
            // Metadata for blocks to show
            blocks: [],
            // Metadata for edges to show
            edges: [],

            // Next block id
            nextBlockId: 1,
            // Next edge id
            nextEdgeId: 1,
            
            // State specific to this blocks instance including all children
            state: getDefaultState(this)
        };
    },
    computed: {
        linkingLine() {
            if (this.state.linkFrom) {
                var position = this.state.linkFrom.getCirclePosition();
                return {
                    x1: position[0],
                    y1: position[1],
                    x2: this.state.mouse[0],
                    y2: this.state.mouse[1],
                    'stroke': 'rgba(0,0,0,0.4)',
                    'stroke-width': 3*this.state.scale
                };
            }
            return null;
        },
        processRegistry() {
            if (this.processes instanceof ProcessRegistry) {
                return this.processes;
            }
            else {
                return new ProcessRegistry(this.processes);
            }
        },
        selectedBlocks() {
            var selected = [];
            if (Array.isArray(this.blocks)) {
                for(var block of this.blocks) {
                    if (Utils.isObject(block.value) && block.value.selected) {
                        selected.push(block);
                    }
                }
            }
            return selected;
        },
        selectedEdges() {
            var selected = [];
            if (Array.isArray(this.edges)) {
                for(var edge of this.edges) {
                    if (edge.selected) {
                        selected.push(edge);
                    }
                }
            }
            return selected;
        },
        selectedSideEdge() {
            if (this.selectedEdges.length === 1 && this.selectedEdges[0].selectedParameter) {
                return this.selectedEdges[0];
            }
            return null;
        },
        pgParameterBlocks() {
            var blocks = [];
            for(var i in this.pgParameters) {
                let param = this.pgParameters[i];
                blocks.push(Vue.observable({
                    id: param.name,
                    type: 'parameter',
                    value: {
                        from_parameter: param.name
                    },
                    x: 0,
                    y: i * 50, // ToDo
                    spec: param
                }));
            }
            return blocks;
        }
    },
    watch: {
        async value(value) {
            await this.import(value, false);
        },
        editable: {
            immediate: true,
            handler(editable) {
                this.state.editable = editable;
            }
        },
        selectedEdges: selectionChangeWatcher,
        selectedBlocks: selectionChangeWatcher
    },
    async mounted() {
        if (!this.supports('error')) {
            // Print error to console if event is not supported by implementing context
            this.$on('error', (msg, title = null) => console.error(msg, title));
        }

        // Setting up default viewer center
        this.moveCenter(0, 0, true);

        // ToDo: Replace with mouseleave?
        document.addEventListener('mouseup', this.onDocumentMouseUp.bind(this));

        await this.import(this.value, false);

        this.historyEnabled = true;
    },
    methods: {
        supports(event) {
            return this.$listeners && this.$listeners[event];
        },
        focus() {
            this.$refs.div.focus();
        },
        link(parameter) {
            if (this.state.linkFrom) {
                this.state.linkTo = parameter;
            }
            else {
                this.state.linkFrom = parameter;
            }
        },
        unlink(parameter = null) {
            if (parameter) {
                if (this.state.linkTo == parameter) {
                    this.state.linkTo = null;
                }
                else if (this.state.linkFrom == parameter) {
                    this.state.linkFrom = null;
                }
            }
            else {
                this.state.linkTo = null;
                this.state.linkFrom = null;
            }
        },
        async onDocumentMouseUp(event) {
            if (this.selectedSideEdge) {
                this.selectEdge(this.selectedSideEdge, null, null, null); // Reset selectedParameter / selectedPosition, but don't change selected state.
            }
            if (this.state.moving && (event.which == 2 || event.which == 1)) {
                this.state.moving = null;
            }
            if (this.state.editable && this.state.linkFrom) {
                if (event.which == 1 && this.state.linkTo) {
                    try {
                        await this.addEdge(this.state.linkFrom, this.state.linkTo);
                    } catch (error) {
                        this.$emit("error", error);
                    }
                }
                this.unlink();
            }
        },
        onKeyDown(event) {
            var allInputs = document.querySelectorAll('input, textarea, button, select, datalist');
            for(let el of allInputs) {
                if (el === document.activeElement) {
                    return;
                }
            }

            // "del" will delete a selected link or block
            if (this.state.editable && event.keyCode == 46) {
                this.deleteSelected();
            }
        },
        onMouseWheel(event) {
            var dX = this.state.mouse[0] - this.state.center[0];
            var dY = this.state.mouse[1] - this.state.center[1];
            var wheelDelta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail)); // Browser compatibility, see https://embed.plnkr.co/plunk/skVoXt
            var deltaScale = Math.pow(1.1, wheelDelta);
            this.moveCenter(-dX*(deltaScale-1), -dY*(deltaScale-1));
            this.state.scale *= deltaScale;
        },
        onMouseMove(event) {
            var rect = this.getDim();
            var mouseX = event.pageX - rect.offsetLeft;
            var mouseY = event.pageY - rect.offsetTop;
            this.state.mouse = [mouseX, mouseY];

            if (this.state.editable && this.selectedSideEdge) {
                var origin = this.selectedSideEdge.selectedPosition;
                var distance = Math.sqrt(Math.pow(mouseX-origin[0], 2)+Math.pow(mouseY-origin[1], 2));
                if (distance > 10) {
                    this.link(this.selectedSideEdge.selectedParameter);
                    this.removeEdge(this.selectedSideEdge);
                    this.saveHistory();
                }
            }

            if (this.state.moving) {
                this.moveCenter((mouseX-this.state.moving[0]), (mouseY-this.state.moving[1]));
                this.state.moving = this.state.mouse;
            }
        },
        onMouseDown(event) {
            this.unselectAll(event);

            let sideSelected = null;
            for (var k in this.$refs.edges) {
                var edge = this.$refs.edges[k];
                var collide = edge.collide(this.state.mouse[0], this.state.mouse[1]);
                if (collide != false) {
                    if (this.selectedEdges.length === 0) {
                        if (collide < 0.3) {
                            sideSelected = edge.parameter2;
                        }
                        else if (collide > 0.7) {
                            sideSelected = edge.parameter1;
                        }
                    }
                    this.selectEdge(k, true, event, sideSelected);
                    event.preventDefault();
                    break;
                }
            }
            
            if (event.which == 2 || (event.which == 1 && !sideSelected)) {
                this.state.moving = this.state.mouse;
            }
            else if (event.which == 1 && event.shiftKey) {
                // Multiselect by drag&drop
            }
        },

        getDim() {
            return Utils.domBoundingBox(this.$refs.div);
        },

        clear() {
            this.edges = [];
            this.blocks = [];
            this.nextBlockId = 1;
            this.nextEdgeId = 1;
        },
    
        /**
         * Enable or disable storing (e.g. for importing)
         */
        enableHistory(enable) {
            this.historyEnabled = enable;
        },
        /**
         * Save the current situation to the history
         */
        saveHistory() {
            if (!this.historyEnabled) {
                return;
            }

            console.trace();
        
            this.history.push(this.export());
            if (this.history.length > historySize) {
                this.history.shift();
            }

            this.$emit('historyChanged', this.history);
        },
        async undo() {
            if (this.history.length) {
                var last = this.history.pop();
                await this.import(last, false);
                this.$emit('historyChanged', this.history);
            }
        },

        setResultNode(block, result = true) {
            block = this.getBlockById(block.id);
            if (block.isResult() === result) {
                return; // Nothing to change
            }

            block.setResult(result);
            var foundNewResultNode = false;
            for(var i in this.$refs.blocks) {
                var other = this.$refs.blocks[i];
                if (other !== block) {
                    // If we set a new result node, ensure that only that node is a result node and no other.
                    if (result) {
                        other.setResult(false);
                    }
                    // Find a potential result node if we don't want this to be the result node
                    else {
                        if (!other.hasOutputEdges()) {
                            other.setResult(true);
                            foundNewResultNode = true;
                            break;
                        }
                    }
                }
            }
            // If we have no new potential result node, communicate to the user.
            if (this.blocks.length > 0 && !result && !foundNewResultNode) {
                this.$emit("error", "No result node available, please specify one.");
            }
            this.saveHistory();
        },

        getPositionForPageXY(x, y) {
            var rect = this.getDim();
            if (x !== null) {
                x = (x - rect.offsetLeft - this.state.center[0]) / this.state.scale;
            }
            if (y !== null) {
                y = (y - rect.offsetTop - this.state.center[1]) / this.state.scale;
            }
            return {x, y};
        },

        addCollection(id, x = null, y = null, defaults = {}) {
            return this.addBlock({
                process_id: 'load_collection',
                arguments: Object.assign({id}, defaults),
                x, y
            });
        },

        addProcess(name, x = null, y = null, node = {}) {
            return this.addBlock(Object.assign({
                process_id: name,
                x, y
            }, node));
        },

        addBlock(node, id = null) {
            let process = {};
            if (this.processRegistry) {
                process = this.processRegistry.get(node.process_id);
            }
            else {
                process = {};
            }

            var rect = this.getDim();
            var block = {
                id: String(this.incrementId(id)),
                type: 'process',
                value: typeof node.toJSON === 'function' ? node.toJSON() : node,
                spec: process || {}
            };

            var size = this.estimateBlockSize(block);
            if (block.value.x === null) {
                block.value.x = (-this.state.center[0] + rect.width/2)/this.state.scale - size[0]/2 + this.newBlockOffset;
            }
            if (block.value.y === null) {
                block.value.y = (-this.state.center[1] + rect.height/2)/this.state.scale - size[1]/2 + this.newBlockOffset;
            }
            if (this.newBlockOffset < 150) {
                this.newBlockOffset += 10;
            }
            
            this.blocks.push(Vue.observable(block));
            this.saveHistory();
            return block;
        },

        estimateBlockSize(block) {
            // ToDo: Doesn't recognize that collections has one parameter less
            var inputs = Math.max(
                Utils.isObject(block.value) ? Utils.size(block.value.arguments) : 0,
                Utils.isObject(block.spec) ? Utils.size(block.spec.parameters) : 0
            );

            var width;
            if (inputs > 0) {
                width = this.state.compactMode ? 110 : 200;
            }
            else {
                width = this.state.compactMode ? 60 : 110;
            }

            var commentHeight = (Utils.isObject(block.value) && typeof block.value.description === 'string') ? 40 : 0;
            var height = 20 + inputs * 15 + commentHeight;

            return [width, height];
        },

        moveCenter(dX, dY, reset = false) {
            var rect = this.getDim();
            this.state.center = [
                (reset ? rect.width/2 : this.state.center[0]) + dX,
                (reset ? rect.height/2 : this.state.center[1]) + dY
            ];
            this.newBlockOffset = 0;
        },

        unselectAll(event = null) {
            if (event && event.shiftKey) {
                return; // Allow multi select
            }
            for(var i in this.blocks) {
                this.$set(this.blocks[i].value, "selected", false);
            }
            for(var i in this.edges) {
                this.selectEdge(i, false);
            }
        },

        selectEdge(edge, select = true, event = null, parameter = null) {
            if (event) {
                this.unselectAll(event);
            }
            if (!Utils.isObject(edge)) {
                edge = this.edges[edge];
            }
            if (select !== null) {
                this.$set(edge, "selected", select);
            }
            this.$set(edge, "selectedParameter", parameter);
            this.$set(edge, "selectedPosition", parameter ? this.state.mouse : null);
        },

        /**
         * Edge to remove
         */
        removeEdge(edge) {
            edge.parameter1.eraseEdge(edge);
            edge.parameter2.eraseEdge(edge);
            this.$delete(this.edges, this.edges.indexOf(edge));
        },
            
        /**
         * Remove a block
         */
        removeBlock(block) {
            var i = this.blocks.findIndex(b => b.id == block.id);
            if (i < 0) {
                return;
            }

            for (var edge of this.edges.slice(0)) {
                if (edge.parameter1.$parent.id === block.id || edge.parameter2.$parent.id === block.id) {
                    this.removeEdge(edge);
                }
            }

            this.$delete(this.blocks, i);

            if (block.value.result) {
                this.setResultNode(block, false);
            }
        },

        /**
         * Retreive a block by ID
         */
        getBlockById(blockId) {
            if (Array.isArray(this.$refs.blocks)) {
                var blocks = this.$refs.blocks.filter(block => block.id === blockId);
                if (blocks.length > 0) {
                    return blocks[0];
                }
            }
            return null;
        },

        getPgParameterBlockByName(name)  {
            for(var i in this.$refs.pgParameters) {
                var block = this.$refs.pgParameters[i];
                if (block.name === name) {
                    return block;
                }
            }
            return null;
        },

        hasSelection() {
            return this.selectedBlocks.length > 0 || this.selectedEdges.length > 0;
        },
        /**
         * Delete the current link
         */
        deleteSelected() {
            if (!this.hasSelection()) {
                return;
            }

            // Remove the selected blocks and its edges
            for(var block of this.selectedBlocks.slice(0)) { // copy to avoid race condition
                this.removeBlock(block);
            }

            // Removes the selected edges
            for(var edge of this.selectedEdges.slice(0)) { // copy to avoid race condition
                this.removeEdge(edge);
            }

            this.saveHistory();
        },

        async addEdgeByNames(b1, p1, b2, p2) {
            var block1 = this.getBlockById(b1) || this.getPgParameterBlockByName(b1);
            if (!block1) {
                throw "Can't find block " + b1;
            }
            var block2 = this.getBlockById(b2) || this.getPgParameterBlockByName(b2);
            if (!block2) {
                throw "Can't find block " + b2;
            }
            await this.addEdge(
                block1.getBlockParameter(p1),
                block2.getBlockParameter(p2)
            );
        },
 
        async addEdge(p1, p2) {
            if (!p1 || !p2) {
                throw 'One of the parameters is invalid.';
            }
            // Check whether you want to connect the same parameters
            if (p1 == p2) {
                return; // Probably by mistake, don't show an error to not annoy people
            }
            // Check whether you want to connect the block to itself
            if (p1.$parent == p2.$parent) {
                throw 'You can\'t link a block to itself';
            }

            var id = this.nextEdgeId++;
            var edge = {id, selected: false, inactive: false};
            if (p1.output) {
                edge.parameter1 = p1;
                edge.parameter2 = p2;
            }
            else {
                // Reverse the order of in and out
                edge.parameter1 = p2;
                edge.parameter2 = p1;
            }

            // You have to link an input with an output
            if (!edge.parameter1.output) {
                throw 'You have to link an input with an output';
            }
            // Check for non-recursiveness
            if (this.allSuccessors(edge.parameter1).indexOf(edge.parameter2.id) !== -1) {
                throw 'You can not create a loop';
            }
            // Check type compatibility
            if (!JsonSchemaValidator.isSchemaCompatible(edge.parameter1.schema, edge.parameter2.schema, false, true)) {
                throw 'Incoming data type is not compatible for parameter "' + edge.parameter2.name;
            }
            // Check whether the data type allows multiple input edges
            if (edge.parameter2.getEdgeCount() > 0 && !edge.parameter2.allowsMultipleInputs) {
                throw 'Parameter accepts only one input';
            }

            // Check whether the edge exists
            for (var k in this.$refs.edges) {
                if (this.$refs.edges[k].equals(edge)) {
                    throw 'This connection exists already';
                }
            }

            this.unlink();

            // Create edge
            this.edges.push(Vue.observable(edge));
            edge.parameter1.addEdge(edge);
            edge.parameter2.addEdge(edge);

            // Update result node
            await this.$nextTick();
            this.setResultNode(edge.parameter1.$parent, false);

            this.saveHistory();
        },

        /**
         * Find all successors of a block, and their successors
         */
        allSuccessors(outputParameter) {
            var block = outputParameter.$parent;
            // Blocks already explored
            var explored = {};
            var exploreList = [block];
            explored[block.id] = true;
        
            while (exploreList.length > 0) {
                var currentBlock = exploreList.pop();
                for (var key in currentBlock.edges) {
                    for (var i in currentBlock.edges[key]) {
                        var edge = currentBlock.edges[key][i];
                        if (edge.block1 == currentBlock) {
                            var target = edge.block2;
                            if (!(target.id in explored)) {
                                explored[target.id] = true;
                                exploreList.push(target);
                            }
                        }
                    }
                }
            }

            return Object.values(explored);
        },

        /**
         * Changing the compact mode
         */
        toggleCompact() {
            let enable = !this.state.compactMode;
            this.state.compactMode = !!enable;
            this.$emit('compactMode', enable);
        },

        export(internal = false) {
            var nodes = {};
            for(var block of this.blocks) {
                let copy = Object({}, block);
                if (!internal) {
                    delete copy.x;
                    delete copy.y;
                    delete copy.selected;
                }
                nodes[block.id] = copy;
            }

            var pg = {
            // ToDo: Add id, parameters, returns, etc.
            //  id: null,
            //  summary: null,
            //  description: null,
            //  categories: [],
            //  experimental: false,
            //  parameters: null,
            //  returns: null,
                process_graph: nodes,
            //  exceptions: [],
            //  examples: [],
            //  links: []
            }
            
            return pg;
        },

        async import(process, addToHistory = true, clear = true) {
            let success = true;

            // disable history for import so that not every import step is in the history...
            this.enableHistory = false;

            // clear screen...
            if (clear) {
                this.clear();
            }

            let onError = async (error) => {
                // If an error occured: show it an restore the last working state from history.
                this.$emit('error', error, "Process graph invalid");
                console.log(error);
                await this.undo();
                success = false;
            };

            try {
                // Parse process 
                var pg;
                // ToDO: Earlier this was always a ProcessGraph Object, but that seems no longer to be the case. How to clean-up?
                if (process instanceof ProcessGraph) {
                    // Make a copy
                    pg = new ProcessGraph(process.toJSON(), this.processRegistry);
                    pg.setParent(process.parentProcessId, process.parentParameterName);
                }
                else {
                    pg = new ProcessGraph(process, this.processRegistry);
                }
                pg.parse();

                // Import nodes
                this.importNodes(pg.getStartNodes());

                // Import edges
                await this.$nextTick();
                await this.importEdges(pg).catch(error => onError(error));

                // Update scale
                await this.perfectScale();
            } catch (error) {
                onError(error);
            }
            
            this.enableHistory = true;
            if (addToHistory) {
                this.saveHistory();
            }

            return success;
        },

        async importEdges(pg) {
            var nodes = pg.getNodes();
            for(var node of Object.values(nodes)) {
                var args = node.getArgumentNames();
                for(let i in args) {
                    var val = node.getRawArgumentValue(args[i]);
                    switch(node.getArgumentType(args[i])) {
                        case 'result':
                            await this.addEdgeByNames(pg.getNode(val).id, "output", node.id, args[i], false);
                            break;
                        case 'parameter':
                            // ToDo, add pg parameter block similar to reduce/apply etc. instead of try-catching this
                            try {
                                await this.addEdgeByNames(val, "output", node.id, args[i], false);
                            } catch (error) {
                                console.log(error);
                            }
                            break;
                        case 'object':
                        case 'array':
                            await this.importEdgeDeep(val, pg, node, args, i);
                            break;
                    }
                }
            }
        },

        async importEdgeDeep(val, pg, node, args, i) {
            for(let k in val) {
                if(val[k] && typeof val[k] === "object"){
                    await this.importEdgeDeep(val[k], pg, node, args, i);
                }
                else if (!Utils.isRef(val)) {
                    continue;
                }
                else if (val.from_node) {
                    await this.addEdgeByNames(pg.getNode(val.from_node).blockId, "output", node.blockId, args[i], false);
                }
                else if (val.from_parameter) {
                    await this.addEdgeByNames(val.from_parameter, "output", node.blockId, args[i], false);
                }
            }
        },

        importNodes(nodes, x = 0, y = 0, imported = []) {
            for(let i in nodes) {
                // `node` is a Node class instance as defined by the js-processgraphs library
                // `data` is the simple object that is defined by JSON process graphs
                // `block` is the representation used by the Block component to render the block
                let node = nodes[i];
                if (imported.includes(node.id)) {
                    continue; // Node has already been added
                }

                let data = typeof node.toJSON === 'function' ? node.toJSON() : node;
                if (typeof data.x !== 'number') {
                    data.x = x;
                }
                if (typeof data.y !== 'number') {
                    data.y = y;
                }

                let block = this.addBlock(data, node.id);
                imported.push(node.id);

                let size = this.estimateBlockSize(block);
                this.importNodes(node.getNextNodes(), data.x + size[0] + 20, data.y, imported);
                y = data.y + size[1] + 20;
            }
        },

        incrementId(id = null) {
            if (typeof id !== 'number' && (typeof id !== 'string' || id.length === 0)) {
                id = this.nextBlockId;
                this.nextBlockId++;
            }
            else if (!isNaN(parseInt(id))) {
                this.nextBlockId = Math.max(this.nextBlockId, parseInt(id)+1);
            }
            return id;
        },

        /**
         * Go to the perfect scale
         */
        async perfectScale() {
            await this.$nextTick();

            if (!this.$refs.div || this.$refs.blocks.length === 0) {
                return;
            }

            var xMin = null, xMax = null;
            var yMin = null, yMax = null;

            for (let k in this.$refs.blocks) {
                let block = this.$refs.blocks[k];
                let size = this.estimateBlockSize(block);
                if (xMin == null) {
                    xMin = block.x-15
                    xMax = block.x+18;
                    yMin = block.y-15
                    yMax = block.y+115;
                } else {
                    xMin = Math.min(xMin, block.x-15);
                    xMax = Math.max(xMax, block.x+size[0]+18);
                    yMin = Math.min(yMin, block.y-15);
                    yMax = Math.max(yMax, block.y+115);
                }
            }

            var rect = this.$refs.div.getBoundingClientRect();
            var scaleA = rect.width/(xMax-xMin);
            var scaleB = rect.height/(yMax-yMin);
            this.state.scale = Math.min(scaleA, scaleB);
            this.state.center = [
                rect.width/2 - this.state.scale*(xMin+xMax)/2.0,
                rect.height/2 - this.state.scale*(yMin+yMax)/2.0
            ];
            this.newBlockOffset = 0;
        }

    }
};
</script>

<style scoped>
.canvas {
    width: 100%;
    height: 100%;
}
</style>