<template>
    <div ref="div" :id="id" class="blocks_js_editor" tabindex="0"
        @mousemove="onMouseMove($event)"
        @mousedown="onMouseDown($event)"
        @mousewheel.prevent="onMouseWheel($event)"
        @keydown="onKeyDown($event)"
        @focus="highlight(true)"
        @blur="highlight(false)"
        @DOMMouseScroll.prevent="onMouseWheel($event)">
        <!-- @mousewheel for all brothers except Firefox, which needs @DOMMouseScroll - tabindex is to allow focus for delete keystroke etc -->
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" class="canvas">
            <Edge v-for="edge in edges" ref="edges" :key="edge.id"
                v-bind="edge" :state="state"
                :parameter1="edge.parameter1"
                :parameter2="edge.parameter2"
                @position="edge.position1 = arguments[0]; edge.position2 = arguments[1]" />
            <line v-if="linkingLine" v-bind="linkingLine" />
            <rect v-if="selectRect" v-bind="selectRect" />
        </svg>
        <div class="blocks">
            <Block v-for="block in blocks" :key="block.type + block.id"
                :id="block.id" :type="block.type" :value="block.value" :spec="block.spec" :state="state" :selected.sync="block.selected"
                @input="commit()"
                @mounted="mountBlock" @unmounted="unmountBlock"
                @move="startDragBlock" @moved="refreshEdges" />
        </div>
    </div>
</template>

<script>
import Block from './Block.vue';
import Edge from './Edge.vue';
import Utils from '../../utils.js';
import { JsonSchemaValidator, ProcessGraph, ProcessRegistry } from '@openeo/js-processgraphs';
import Vue from 'vue';
import boxIntersectsBox from 'intersects/box-box';
import boxIntersectsLine from 'intersects/box-line';

/*
Events:

Emits:
- error(message, title = null): Show error message
- showProcess(id): Show process by id
- showCollection(id): Show collection by id
- showSchema(name, schema): Show JSON schema
- editParameters(parameters, values, title = "Edit", isEditable = true, selectParameterName = null, saveCallback(data) = null, processId = null): Show the parameter editor
- compactMode(enable): Informs about the current state of compact mode.
- input(value) - The value has been updated
- historyChanged(history, undoIndex = null, redoIndex = null) - The history has been changed
*/

const getDefaultState = function(blocks) {
    return Vue.observable({
        root: blocks,
        editable: false,
        compactMode: false,
        moving: null, // Is the user dragging the view?
        selecting: null, // Is the user multi-selecting?
        center: [0,0],
        mouse: [0,0],
        scale: 1.3,
        linkFrom: null, // Array
        linkTo: null // Array
    });
};
const MARGIN = 20;

const selectionChangeWatcher = function (newVal, oldVal) {
    if (!Array.isArray(newVal) || !Array.isArray(oldVal) || newVal.length !== oldVal.length || !newVal.every((value,i) => value.id === oldVal[i].id)) {
        this.$emit('selectionChanged', this.selectedBlocks, this.selectedEdges);
    }
};
const historySize = 30;

export default {
    name: 'Blocks',
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
            default: () => ({})
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
            historyPointer: null,

            process: this.value,
            // Metadata for blocks to show
            blocks: [],
            // Metadata for edges to show
            edges: [],

            processGraph: null,

            // Next block id
            nextBlockId: 1,
            // Next edge id
            nextEdgeId: 1,

            activeTransactions: 0,
            
            // State specific to this blocks instance including all children
            state: getDefaultState(this)
        };
    },
    computed: {
        selectRect() {
            if (!this.state.selecting) {
                return null;
            }
            return {
                x: Math.min(this.state.mouse[0], this.state.selecting[0]),
                y: Math.min(this.state.mouse[1], this.state.selecting[1]),
                width: Math.abs(this.state.mouse[0] - this.state.selecting[0]),
                height: Math.abs(this.state.mouse[1] - this.state.selecting[1]),
                'stroke': 'rgba(0,0,0,0.8)',
                'stroke-width': 1,
                'fill': 'rgba(0,0,0,0.05)'
            };
        },
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
        processBlocks() {
            return this.blocks.filter(b => b.type === 'process');
        },
        selectedBlocks() {
            return this.blocks.filter(block => block.selected);
        },
        selectedEdges() {
            return this.edges.filter(edge => edge.selected);
        },
        selectedSideEdge() {
            if (this.selectedEdges.length === 1 && this.selectedEdges[0].selectedParameter) {
                return this.selectedEdges[0];
            }
            return null;
        }
    },
    watch: {
        pgParameters(value) {
            this.importPgParameters(value, 'prop');
        },
        async value(value) {
            // Only import when user changes data (i.e. not a BlocksProcess exported from export())
            if (!(value instanceof BlocksProcess)) {
                this.process = value;
                await this.import(value, { propagate: false, undoOnError: false }); // don't propagate, otherwise results in an infinite loop
            }
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
        this.onDocumentMouseUpFn = this.onDocumentMouseUp.bind(this)
        document.addEventListener('mouseup', this.onDocumentMouseUpFn);

        await this.importPgParameters(this.pgParameters, 'prop');
        if (!await this.import(this.value, { propagate: false, undoOnError: false })) {
            this.perfectScale();
        }
        selectionChangeWatcher.bind(this)();
    },
    beforeDestroy() {
        document.removeEventListener('mouseup', this.onDocumentMouseUpFn);
    },
    methods: {
        mountBlock(node) {
            this.setBlockElement(node, node);
        },
        unmountBlock(node) {
            this.setBlockElement(node, null);
        },
        setBlockElement(node, setTo) {
            for(var block of this.blocks) {
                if (block.id === node.id) {
                    block.$el = setTo;
                    return;
                }
            }
        },
        startDragBlock() {
            for(let i in this.blocks) {
                if (this.blocks[i].$el) {
                    this.blocks[i].$el.startDrag();
                }
            }
        },
        refreshEdges() {
            for(let i in this.$refs.edges) {
                this.$refs.edges[i].updatePositions();
            }
        },
        supports(event) {
            return this.$listeners && this.$listeners[event];
        },
        focus() {
            this.$refs.div.focus();
        },
        highlight(enable) {
            if (enable) {
                this.$refs.div.classList.add("focus");
            }
            else {
                this.$refs.div.classList.remove("focus");
            }
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
        multiSelect() {
            let box = this.selectRect;
            this.blocks
                .filter(b => {
                    if (Array.isArray(b.value.position) && b.$el) {
                        let pos = b.$el.getDimensions();
                        return boxIntersectsBox(box.x, box.y, box.width, box.height, pos.x, pos.y, pos.width, pos.height);
                    }
                    return false;
                })
                .map(b => b.selected = true);
            this.edges
                .filter(e => Array.isArray(e.position1) && Array.isArray(e.position2) && boxIntersectsLine(box.x, box.y, box.width, box.height, e.position1[0], e.position1[1], e.position2[0], e.position2[1]))
                .map(e => e.selected = true);
        },
        async onDocumentMouseUp(event) {
            if (this.selectedSideEdge) {
                this.selectEdge(this.selectedSideEdge, null, null, null); // Reset selectedParameter / selectedPosition, but don't change selected state.
            }
            if (this.state.selecting) {
                this.multiSelect();
                this.state.selecting = null;
            }
            if (this.state.moving) {
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
            var rect = this.getDimensions();
            var mouseX = event.pageX - rect.offsetLeft;
            var mouseY = event.pageY - rect.offsetTop;
            this.state.mouse = [mouseX, mouseY];

            if (this.state.editable && this.selectedSideEdge) {
                var origin = this.selectedSideEdge.selectedPosition;
                var distance = Math.sqrt(Math.pow(mouseX-origin[0], 2)+Math.pow(mouseY-origin[1], 2));
                if (distance > 10) {
                    this.link(this.selectedSideEdge.selectedParameter);
                    this.removeEdge(this.selectedSideEdge);
                    this.commit();
                }
            }

            if (this.state.moving) {
                this.moveCenter((mouseX-this.state.moving[0]), (mouseY-this.state.moving[1]));
                this.state.moving = this.state.mouse;
            }
        },
        onMouseDown(event) {
            let sideSelected = null;

            if (event.which == 1 && event.shiftKey) {
                this.state.selecting = this.state.mouse;
            }
            else if (event.which == 1) {
                this.unselectAll(event);

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
            }

            if (event.which == 2 || (event.which == 1 && !sideSelected && !event.shiftKey)) {
                this.state.moving = this.state.mouse;
            }

            this.focus();
        },

        getDimensions() {
            return Utils.domBoundingBox(this.$refs.div);
        },

        async clear() {
            return await this.startTransaction(async () => {
                this.edges = [];
                // Don't remove parameters injected by props (fixed callback parameters)
                this.blocks = this.blocks.filter(b => b.type === 'parameter' && b.spec.origin === 'prop');
                this.nextBlockId = 1;
                this.nextEdgeId = 1;
                this.process = {};
                return true;
            });
        },

        commit(data = null, history = true, propagate = true) {
            // Don't commit when in a transaction
            if (this.activeTransactions > 0) {
                return;
            }

            if (history !== false) {
                this.saveHistory();
            }
            if (propagate !== false) {
                this.$emit('input', data === null ? this.export() : data);
            }
        },
    
        /**
         * Save the current situation to the history
         */
        saveHistory() {
            var data = this.export(true);
            this.history.splice(this.historyPointer + 1, this.historySize, data);
            if (this.history.length > this.historySize) {
                this.history.shift();
            }
            this.historyPointer = this.history.length - 1;
            this.$emit('historyChanged', this.history, this.historyPointer);
        },
        async undo() {
            await this.historyStep(-1);
        },
        async redo() {
            await this.historyStep(1);
        },
        async historyStep(step) {
            var index = this.historyPointer + step;
            var element = this.history[index];
            if (element) {
                this.historyPointer = index;
                this.import(element, { saveHistory: false, undoOnError: false, perfectScale: false });
                this.$emit('historyChanged', this.history, this.historyPointer);
            }
        },

        setResultNode(block, result = true) {
            block = this.getBlockById(block.id);
            if (!block || block.value.result === result) {
                return; // Nothing to change
            }

            var setResult = (obj, val) => {
                this.$set(obj.value, 'result', val);
                this.commit();
            }

            setResult(block, result);
            var foundNewResultNode = false;
            var hasOtherBlocks = false;
            for(var other of this.processBlocks) {
                if (block && other.id === block.id) {
                    continue;
                }
                
                hasOtherBlocks = true;
                // If we set a new result node, ensure that only that node is a result node and no other.
                if (result) {
                    setResult(other, false);
                }
                // Find a potential result node if we don't want this to be the result node
                else {
                    if (other.$el && !other.$el.hasOutputEdges()) {
                        setResult(other, true);
                        foundNewResultNode = true;
                        break;
                    }
                }
            }
            // If we have no new potential result node, communicate to the user.
            if (hasOtherBlocks && !result && !foundNewResultNode) {
                this.$emit("error", "No result node available, please specify one.");
            }
        },

        getPositionForPageXY(x, y) {
            var rect = this.getDimensions();
            if (x !== null) {
                x = (x - rect.offsetLeft - this.state.center[0]) / this.state.scale;
            }
            if (y !== null) {
                y = (y - rect.offsetTop - this.state.center[1]) / this.state.scale;
            }
            return [x, y];
        },

        addProcess(name, args = {}, position = [], node = {}) {
            return this.addBlock(Object.assign({
                process_id: name,
                arguments: args,
                position
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

            var block = {
                id: String(this.incrementId(id)),
                type: 'process',
                selected: false,
                value: typeof node.toJSON === 'function' ? node.toJSON() : node,
                spec: process || {}
            };

            var size = this.getBlockSize(block);
            block.value.position = Utils.ensurePoint(block.value.position, () => this.getNewBlockDefaultPosition(size));

            // If there's already a result node, remove the flag here
            if (block.value.result && this.blocks.filter(b => b.value.result === true).length) {
                delete block.value.result;
            }
            // Make this the result node if there's no node yet
            else if (this.processBlocks.length === 0) {
                block.value.result = true;
            }
            
            this.blocks.push(Vue.observable(block));
            this.commit();
            return block;
        },

        getNewBlockDefaultPosition(blockSize) {
            var rect = this.getDimensions();
            var position = [
                (-this.state.center[0] + rect.width/2)/this.state.scale - blockSize[0]/2 + this.newBlockOffset,
                (-this.state.center[1] + rect.height/2)/this.state.scale - blockSize[1]/2 + this.newBlockOffset
            ];
            if (this.newBlockOffset < 150) {
                this.newBlockOffset += 10;
            }
            return position;
        },

        getBlockSize(block) {
            if (block.$el) {
                let dim = block.$el.getDimensions();
                return [dim.width / this.state.scale, dim.height / this.state.scale];
            }

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
            var height = MARGIN + inputs * 15 + commentHeight;

            return [width, height];
        },

        moveCenter(dX, dY, reset = false) {
            var rect = this.getDimensions();
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
                this.$set(this.blocks[i], "selected", false);
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
        async removeBlock(block) {
            return await this.startTransaction(async () => {
                var i = this.blocks.findIndex(b => b.id == block.id);
                if (i < 0) {
                    return false;
                }

                for (var edge of this.edges.slice(0)) {
                    if (edge.parameter1.$parent.id === block.id || edge.parameter2.$parent.id === block.id) {
                        this.removeEdge(edge);
                    }
                }

                if (block.value.result) {
                    this.setResultNode(block, false);
                }

                this.$delete(this.blocks, i);
                return true;
            });
        },

        /**
         * Retreive a block by ID
         */
        getBlockById(blockId) {
            var blocks = this.blocks.filter(block => block.id === blockId);
            if (blocks.length > 0) {
                return blocks[0];
            }
            return null;
        },

        /**
         * Delete the current link
         */
        async deleteSelected() {
            if (this.selectedBlocks.length === 0 && this.selectedEdges.length === 0) {
                return false;
            }

            return await this.startTransaction(async () => {
                // Remove the selected blocks and its edges
                for(var block of this.selectedBlocks.slice(0)) { // copy to avoid race condition
                    if (block.$el.allowsDelete) {
                        this.removeBlock(block);
                    }
                }

                // Removes the selected edges
                for(var edge of this.selectedEdges.slice(0)) { // copy to avoid race condition
                    this.removeEdge(edge);
                }
                return true;
            });
        },

        async addEdgeByNames(b1, p1, b2, p2) {
            var blocks = [];
            for(var id of [b1, b2]) {
                var block = this.getBlockById(id);
                if (!block) {
                    throw "Can't find block: " + id;
                }
                else if (!block.$el) {
                    throw "Block not mounted yet: " + id;
                }
                blocks.push(block.$el);
            }
            await this.addEdge(
                blocks[0].getBlockParameter(p1),
                blocks[1].getBlockParameter(p2)
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
            if (!JsonSchemaValidator.isSchemaCompatible(edge.parameter2.schema, edge.parameter1.schema, false, true)) {
                throw 'Incoming data type is not compatible for parameter "' + edge.parameter2.name + '"';
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

            return await this.startTransaction(async () => {
                this.unlink();

                // Create edge
                this.edges.push(Vue.observable(edge));
                edge.parameter1.addEdge(edge);
                edge.parameter2.addEdge(edge);

                // Update result node
                this.setResultNode(edge.parameter1.$parent, false);
                return true;
            });
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
        async toggleCompact() {
            this.state.compactMode = !this.state.compactMode;
            this.$emit('compactMode', this.state.compactMode);
            await this.$nextTick();
            this.refreshEdges();
        },

        export(internal = false) {
            var nodes = {};
            for(var block of this.processBlocks) {
                let copy = Utils.deepClone(block.value);
                if (!internal) {
                    // Delete internal state for external export 
                    delete copy.position;
                }
                // Remove default values for simplicity
                if (copy.description === null) {
                    delete copy.description;
                }
                if (copy.result !== true) {
                    delete copy.result;
                }
                nodes[block.id] = copy;
            }

            // ToDo: Currently, we just use the id, parameters etc from the original process
            return new BlocksProcess(Object.assign({}, this.process, { process_graph: nodes }));
        },

        // Options may contain:
        // - undoOnError: don't undo changes when an error occured (default: true)
        // - saveHistory: commit the changes to the history (default: true)
        // - propagate: emit the changes to the parent v-model (default: true)
        async startTransaction(fn, options = {}, ...args) {
            let success;
            this.activeTransactions++;

            try {
                success = await fn(args);
            } catch (error) {
                // If an error occured: show it and restore the last working state from history.
                this.$emit('error', error, "Model is invalid");
                console.log(error);
                if (options.undoOnError !== false) {
                    try {
                        await this.undo();
                    } catch (error2) {
                        this.$emit('error', error, "Revert failed");
                        console.log(error);
                    }
                }
                success = false;
            }

            this.activeTransactions--;
            this.commit(null, options.saveHistory, options.propagate);

            return success;
        },

        // Options may contain:
        // - all from startTransaction()
        // - clear: Clear the model builder before import (default: true)
        // - perfectScale: Apply perfect scale after import (default: true)
        async import(process, options = {}) {
            return await this.startTransaction(async () => {
                // clear screen...
                if (options.clear !== false) {
                    await this.clear();
                    this.process = process instanceof ProcessGraph ? process.toJSON() : process;
                }

                if (!Utils.isObject(process)) {
                    return false;
                }

                // Parse process 
                // ToDO: Earlier this was always a ProcessGraph Object, but that seems no longer to be the case. How to clean-up?
                if (process instanceof ProcessGraph) {
                    // Make a copy
                    this.processGraph = new ProcessGraph(process.toJSON(), this.processRegistry);
                    this.processGraph.setParent(process.parentProcessId, process.parentParameterName);
                }
                else {
                    this.processGraph = new ProcessGraph(process, this.processRegistry);
                }
                this.processGraph.allowEmpty();
                this.processGraph.parse();

                await this.importPgParameters(this.processGraph.getParameters(), 'pg', options.clear !== false);
                await this.importNodes(this.processGraph.getStartNodes());
                await this.importEdges(this.processGraph);

                if (options.perfectScale !== false) {
                    this.perfectScale();
                }

                return true;
            }, options);
        },

        async importPgParameters(params, origin, clear = true) {
            if (!Array.isArray(params)) {
                return;
            }

            // Remove existing parameters from the given origin
            if (clear) {
                this.blocks = this.blocks.filter(b => b.type !== 'parameter' || b.spec.origin !== origin);
            }

            let size = this.getBlockSize({}); // Estimate base size for an empty block
            let position = [0,0];
            for(var i in params) {
                let param = params[i];
                position = [
                    -size[0] - MARGIN,
                    i * (size[1] + MARGIN)
                ];

                this.addPgParameter(params[i], origin, position);
            }
            await this.$nextTick();
        },

        addPgParameter(param, origin = 'user', position = null) {
            // Check a parameter with the same name exists
            if (this.blocks.findIndex(p => p.type === 'parameter' && p.id == param.name) >= 0) {
                return;
            }
            param = Utils.deepClone(param);
            if (typeof param.schema === 'undefined') {
                param.schema = {};
            }
            param.origin = origin;
            this.blocks.push(Vue.observable({
                id: param.name,
                type: 'parameter',
                value: {
                    from_parameter: param.name,
                    position: Utils.ensurePoint(position, () => this.getNewBlockDefaultPosition(this.getBlockSize({})))
                },
                spec: param
            }));
        },

        getPgParameters() {
            return this.blocks.filter(b => b.type === 'parameter');
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
                            await this.addEdgeByNames(val, "output", node.id, args[i], false);
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
                    await this.addEdgeByNames(pg.getNode(val.from_node).id, "output", node.id, args[i], false);
                }
                else if (val.from_parameter) {
                    await this.addEdgeByNames(val.from_parameter, "output", node.id, args[i], false);
                }
            }
        },

        async importNodes(nodes, x = 0, y = 0, imported = []) {
            let isInitialCall = imported.length === 0;
            let nextNodes = [];
            let maxX = 0;
            for(let node of nodes) {
                // `node` is a Node class instance as defined by the js-processgraphs library
                // `data` is the simple object that is defined by JSON process graphs
                // `block` is the representation used by the Block component to render the block

                // To get a better layout, only add the block once all previous nodes are added
                if (imported.includes(node.id) || node.getPreviousNodes().filter(prev => !imported.includes(prev.id)).length) {
                    y += MARGIN / 2; // add a small offset so that lines going through a box are easier to see
                    continue;
                }

                let data = typeof node.toJSON === 'function' ? node.toJSON() : node;
                data.position = Utils.ensurePoint(data.position, () => [x,y]);

                let block = this.addBlock(data, node.id);
                imported.push(node.id);

                let size = this.getBlockSize(block);
                maxX = Math.max(maxX, data.position[0] + size[0]);
                y = data.position[1] + size[1] + MARGIN;

                nextNodes = nextNodes.concat(node.getNextNodes());
            }
            if (nextNodes.length) {
                await this.importNodes(nextNodes, maxX + MARGIN, 0, imported);
            }
            // Wait for all nodes being rendered
            if (isInitialCall) {
                await this.$nextTick();
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
        perfectScale() {
            if (!this.$refs.div || this.blocks.length === 0) {
                return;
            }

            var xMin = null, xMax = null;
            var yMin = null, yMax = null;

            for (let k in this.blocks) {
                let block = this.blocks[k];
                let size = this.getBlockSize(block);
                let pos = Utils.ensurePoint(block.value.position);
                if (xMin == null) {
                    xMin = pos[0]-15
                    xMax = pos[0]+size[0]+15;
                    yMin = pos[1]-15
                    yMax = pos[1]+size[1]+15;
                } else {
                    xMin = Math.min(xMin, pos[0]-15);
                    xMax = Math.max(xMax, pos[0]+size[0]+15);
                    yMin = Math.min(yMin, pos[1]-15);
                    yMax = Math.max(yMax, pos[1]+size[1]+15);
                }
            }

            var rect = this.$refs.div.getBoundingClientRect();
            var scaleA = rect.width/(xMax-xMin);
            var scaleB = rect.height/(yMax-yMin);
            this.state.scale = Math.min(scaleA, scaleB, 1.5); // Don't scale higher than 1.5
            this.state.center = [
                rect.width/2 - this.state.scale*(xMin+xMax)/2.0,
                rect.height/2 - this.state.scale*(yMin+yMax)/2.0
            ];
            this.newBlockOffset = 0;
        }
    }
};

class BlocksProcess {
    constructor(process) {
        Object.assign(this, process);
    }
}
</script>

<style scoped>
.canvas {
    width: 100%;
    height: 100%;
}
.blocks {
    box-sizing: border-box;
    border: 1px solid transparent;
}
.focus .blocks {
    border-color: rgba(22, 102, 182, 0.3);
}
.blocks_js_editor:focus, .blocks:focus, .canvas:focus {
    outline: 0;
}
</style>