<template>
	<div ref="div" :id="id" class="blocks_js_editor"
        @mousemove="onMouseMove($event)"
        @mousedown="onMouseDown($event)"
        @mousewheel.prevent="onMouseWheel($event)"
        @DOMMouseScroll.prevent="onMouseWheel($event)"> <!-- @mousewheel for all brothers except Firefox, which needs @DOMMouseScroll -->
        <svg ref="element" xmlns="http://www.w3.org/2000/svg" version="1.1" class="canvas">
            <Edge v-for="edge in edges" ref="edge" :key="edge.id" v-bind="edge" />
            <line v-if="linkingLine" v-bind="linkingLine" />
        </svg>
		<div class="blocks">
            <Block v-for="block in pgParameterBlocks" :key="block.id" :parent="templateThis" v-bind="block" />
            <Block v-for="block in blocks" ref="blocks" :key="block.id" :parent="templateThis" v-bind="block" />
        </div>
	</div>
</template>

<script>
import BlocksState from './state.js';
import History from './history.js';
import Block from './Block.vue';
import Edge from './Edge.vue';
import Utils from '../../utils.js';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import { JsonSchemaValidator, ProcessGraph, ProcessRegistry } from '@openeo/js-processgraphs';
import Vue from 'vue';

/*
Events:

Emits:
- blocks.unselect(): Unselect all blocks
- blocks.error(message, title = null): Show error message
- blocks.showProcess(id): Show process by id
- blocks.showCollection(id): Show collection by id
- blocks.showSchema(name, schema): Show JSON schema
- blocks.showParameterEditor(blocks, block, editable, parameterName): Show the parameter editor
- blocks.remove(block): Removes the specified block.
- blocks.link(parameter): Adds the parameter to the linking process.
- blocks.compactMode(enable): Informs about the current state of compact mode.

- blocks.perfectScale
- blocks.removeSelected etc.

Listens to:
- blocks.updateParameters(...): ...
*/

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
		readOnly: {
			type: Boolean,
			default: true
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
        },
        supportedEvents: {
            type: Array,
            default: () => []
        },
        openParameterEditor: {
            type: Function,
            default: null
        }
	},
	data() {
		return Object.assign({
        	active: true,

        	newBlockOffset: 0,

            // History manager
        	history: new History(this),

            // Is the user dragging the view ?
        	moving: null,

            // Selected items
        	selectedLink: null,
        	selectedSide: null,

            // Instances
        	blocks: [],

            // Edges
        	edges: [],

            /**
             * Next block id
             */
        	nextBlockId: 1,

            /**
             * Next edge id
             */
        	nextEdgeId: 1
		}, BlocksState);
    },
	computed: {
        templateThis() {
            return this;
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
        selectedBlocks() {
            var selected = [];
            if (Array.isArray(this.$refs.blocks)) {
                for(var block of this.$refs.blocks) {
                    if (block.selected) {
                        selected.push(block);
                    }
                }
            }
            return selected;
        },
        selectedEdges() {
            // ToDo, see selectedBlocks
            return [];
        },
        pgParameterBlocks() {
            var blocks = [];
            for(var i in this.pgParameters) {
                let param = this.pgParameters[i];
                blocks.push({
                    id: param.name,
                    type: 'parameter',
                    value: {
                        from_parameter: param.name
                    },
                    position: [0, i * 50], // ToDo
                    spec: param
                });
            }
            return blocks;
        }
	},
    watch: {
        readOnly: {
            immediate: true,
            handler(readOnly) {
                this.setReadOnly(readOnly);
            }
        },
        value(value) {
            this.import(value);
        },
        supportedEvents: {
            immediate: true,
            handler(events) {
                this.setSupportedEvents(events);
            }
        }
    },
    mounted() {
        // Print error to console if event is not supported by implementing context
        this.listen('blocks.error', (msg, title = null) => !this.supports('error') && console.error(msg, title));
        this.listen('blocks.remove', this.removeBlock);
        this.listen('blocks.link', this.link);

        // Setting up default viewer center
        this.moveCenter(0, 0, true);

        document.addEventListener('mouseup', this.onDocumentMouseUp.bind(this));
        document.addEventListener('keydown', this.onDocumentKeyDown.bind(this));

        this.import(this.value);
    },
	methods: {
        onDocumentMouseUp(event) {
            if (!this.readOnly && this.state.linkFrom) {
                if (event.which == 1 && this.state.linkTo) {
                    try {
                        this.addEdge(this.state.linkFrom.parent, this.state.linkFrom, this.state.linkTo.parent, this.state.linkTo);
                    } catch (error) {
                        this.emit("blocks.error", error);
                    }
                }
                this.unlink();
            }
            if (this.moving && (event.which == 2 || event.which == 1)) {
                this.moving = null;
            }
        },
        onDocumentKeyDown(event) {
            var allInputs = document.querySelectorAll('input, textarea, button, select, datalist');
            for(let el of allInputs) {
                if (el === document.activeElement) {
                    return;
                }
            }

            // "del" will delete a selected link or block
            if (!this.readOnly && event.keyCode == 46 && this.active) {
                this.deleteEvent();
            }
        },
        onMouseWheel(event) {
            var dX = this.state.mouse[0] - this.state.center[0];
            var dY = this.state.mouse[1] - this.state.center[1];
            var wheelDelta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail)); // Browser compatibility, see https://embed.plnkr.co/plunk/skVoXt
            var deltaScale = Math.pow(1.1, wheelDelta);
            this.moveCenter(-dX*(deltaScale-1), -dY*(deltaScale-1));
            this.multiplyScale(deltaScale);
        },
        onMouseMove(event) {
            var rect = this.getDim();
            var mouseX = event.pageX - rect.offsetLeft;
            var mouseY = event.pageY - rect.offsetTop;
            this.setMousePos(mouseX, mouseY);

            if (!this.readOnly && this.selectedSide) {
                var distance = Math.sqrt(Math.pow(mouseX-this.selectedSide[1],2)+Math.pow(mouseY-this.selectedSide[2],2));
                if (distance > 15) {
                    var edge = this.edges[this.selectedLink];
                    if (this.selectedSide[0] == 2) {
                        this.startLinking(edge.block1, edge.parameter1.name);
                    } else {
                        this.startLinking(edge.block2, edge.parameter2.name);
                    }

                    this.removeEdge(this.selectedLink);
                    this.selectedSide = null;
                    if (this.selectedLink != null && (this.selectedLink in this.edges)) {
                        this.selectEdge(this.selectedLink, false);
                    }
                    this.selectedLink = null;
                }
            }

            if (this.moving) {
                this.moveCenter((mouseX-this.moving[0]), (mouseY-this.moving[1]));
                this.moving = this.state.mouse;
            }
        },
        onMouseDown(event) {
            this.emit('blocks.unselect');

            if (this.selectedLink != null) {
                this.selectEdge(this.selectedLink, false);
            }
            this.selectedLink = null;
            this.selectedSide = null;

            if (this.selectedBlocks.length === 0) {
                for (var k in this.edges) {
                    var collide = this.edges[k].collide(this.state.mouse[0], this.state.mouse[1]);
                    if (collide != false) {
                        if (collide < 0.2) {
                            this.selectedSide = [1, this.state.mouse[0], this.state.mouse[1]];
                        } else if (collide > 0.8) {
                            this.selectedSide = [2, this.state.mouse[0], this.state.mouse[1]];
                        }
                        this.selectedLink = k;
                        this.selectEdge(k);
                        event.preventDefault();
                        break;
                    }
                }
            }
            
            if (event.which == 2 || (event.which == 1 && !event.shiftKey)) {
                this.moving = this.state.mouse;
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

        hasUndo() {
            if (this.history === null) {
                return 0;
            }
            return this.history.size() > 0;
        },

        undo() {
            if (this.history === null) {
                return;
            }
            this.history.restoreLast();
        },

        setResultNode(block, result = true) {
            if (block.result === result) {
                return; // Nothing to change
            }

            block.setResult(result);
            var foundNewResultNode = false;
            for(var i in this.blocks) {
                var other = this.blocks[i];
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
                this.emit("blocks.error", "No result node available, please specify one.");
            }
            this.history.save();
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
            return this.createBlock({
                process_id: 'load_collection',
                arguments: Object.assign({id}, defaults)
            }, x, y);
        },

        addProcess(name, x = null, y = null, node = {}) {
            return this.createBlock(Object.assign({
                process_id: name,
            }, node), x, y);
        },

        createBlock(node, x = null, y = null) {
            let process = {};
            if (this.processRegistry) {
                process = this.processRegistry.get(node.process_id);
            }
            else {
                process = {};
            }

            var value = {};
            if (this.blocks.length === 0) {
                value.result = true;
            }


            var rect = this.getDim();
            var block = {
                id: String(this.incrementId(node.id)),
                type: 'process',
                value: Object.assign(value, node),
                position: [x, y],
                spec: process || {}
            };

            var size = this.estimateBlockSize(block);
            if (block.position[0] === null) {
                block.position[0] = (-this.state.center[0] + rect.width/2)/this.state.scale - size[0]/2 + this.newBlockOffset;
            }
            if (block.position[1] === null) {
                block.position[1] = (-this.state.center[1] + rect.height/2)/this.state.scale - size[1]/2 + this.newBlockOffset;
            }
            if (this.newBlockOffset < 150) {
                this.newBlockOffset += 10;
            }
            
            this.blocks.push(block);
            this.history.save();
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
            this.setCenter(
                (reset ? rect.width/2 : this.state.center[0]) + dX,
                (reset ? rect.height/2 : this.state.center[1]) + dY
            );
            this.newBlockOffset = 0;
        },

        selectEdge(index, select = true) {
            Vue.set(this.edges[index], "selected", select);
        },

        /**
         * Edge to remove
         */
        removeEdge(edge) {
            this.eraseEdge(edge);
            this.edges.splice(edge, 1);
            this.history.save();
        },

        /**
         * Initializes the edge and do some tests
         */ 
        createEdge(edge, isDataChange = true) {
            // You can't link a block to itself
            if (edge.block1 == edge.block2) {
                throw 'You can\'t link a block to itself';
            }

            // You have to link an input with an output
            if (edge.parameter1.type == edge.parameter2.type) {
                throw 'You have to link an input with an output';
            }

            edge.parameter1.addEdge(this, isDataChange);
            edge.parameter2.addEdge(this, isDataChange);
        },

        eraseEdge(edge) {
 //         edge.parameter1.eraseEdge(edge);
 //         edge.parameter2.eraseEdge(edge);
        },
            
        /**
         * Remove a block
         */
        removeBlock(block) {
            var i = this.blocks.findIndex(b => b.id == block.id);
            if (i < 0) {
                return;
            }

            for (var k in this.edges.slice(0)) {
                var edge = this.edges[k];
                if (edge.block1 == block || edge.block2 == block) {
                    Vue.delete(this.edges, i);
                    this.eraseEdge(edge);
                }
            }
            Vue.delete(this.blocks, i);

            if (block.result) {
                this.setResultNode(block, false);
            }
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

        getPgParameterBlockByName(name)  {
            for(var i in this.blocks) {
                var block = this.blocks[i];
                if (block.isPgParameter && block.name === name) {
                    return block;
                }
            }
            return null;
        },
        canDelete() {
            return this.selectedBlocks.length > 0 || this.selectedEdges.length > 0;
        },

        saveHistory() {
            this.history.save();
        },

        /**
         * Delete the current link
         */
        deleteEvent() {
            if (!this.canDelete()) {
                return;
            }

            // Remove the selected blocks and its edges
            this.history.save();
            for(var block of this.selectedBlocks.slice(0)) { // copy to avoid race condition
                this.removeBlock(block);
            }

            // Removes the selected edges
            for(var edge of this.selectedEdges.slice(0)) { // copy to avoid race condition
                this.removeEdge(edge);
            }
        },

        addEdge(blockOut, fieldOut, blockIn, fieldIn, isDataChange = true) {
            return; // ToDo

            if (typeof blockOut === 'string') {
                blockOut = this.getBlockById(blockOut);
            }
            if (typeof blockIn === 'string') {
                blockIn = this.getBlockById(blockIn);
            }

            var id = this.nextEdgeId++;

            if (typeof fieldOut === 'string') {
                fieldOut = blockOut.getField(fieldOut);
            }
            if (typeof fieldIn === 'string') {
                fieldIn = blockIn.getField(fieldIn);
            }

            if (fieldOut.output) {
                var edge = new Edge(id, blockOut, fieldOut, blockIn, fieldIn, this);
            } else {
                var edge = new Edge(id, blockIn, fieldIn, blockOut, fieldOut, this);
            }

            // Check for loops or whether you want to connect the same fields
            if (edge.block1 === edge.block2) {
                return;
            }
            else if (edge.block2.allSuccessors().indexOf(edge.block1.id) != -1) {
                throw 'You can not create a loop';
            }

            // Check type compatibility
            if (!JsonSchemaValidator.isSchemaCompatible(fieldIn.schema, fieldOut.schema, false, true)) {
                throw 'Incoming data type is not compatible for field "' + fieldIn.name + '" of block #' + blockIn.id;
            }
            // Check whether the data type allows multiple input edges
            if (fieldIn.getEdgeCount() > 0 && !fieldIn.allowsMultipleInputs()) {
                throw 'Parameter accepts only one input';
            }

            // Check whether the edge exists
            for (var k in this.edges) {
                var other = this.edges[k];
                if (other.equals(edge)) {
                    throw 'This connection exists already';
                }
            }

            // Create edges
            this.createEdge(edge, isDataChange);
            this.edges.push(edge);

            // Update result node
            if (isDataChange) {
                this.setResultNode(fieldOut.output ? blockOut : blockIn, false);
            }
            
            this.unlink();
            this.history.save();
        },

        /**
         * Changing the compact mode
         */
        toggleCompact() {
            let enable = !this.state.compactMode;
            this.enableCompactMode(enable);
            this.emit('blocks.compactMode', enable);
        },

        export(internal = false) {
            var nodes = {};
            if (Array.isArray(this.$refs.blocks)) {
                for(var i in this.$refs.blocks) {
                    let block = this.$refs.blocks[i].export(internal);
                    if (block) {
                        nodes[block.id] = block;
                    }
                }
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

        import(process, registry, addToHistory = true, clear = true) {
            let success = true;

            // disable history for import so that not every import step is in the history...
            this.history.enable(false);

            // clear screen...
            if (clear) {
                this.clear();
            }

            try {
                // Parse process 
                var pg;
                if (process instanceof ProcessGraph) {
                    // Make a copy
                    pg = new ProcessGraph(process.toJSON(), registry);
                    pg.setParent(process.parentProcessId, process.parentParameterName);
                }
                else {
                    pg = new ProcessGraph(process, registry);
                }
                pg.parse();

                // Import nodes
                this.importNodes(pg.getStartNodes());

                // Import edges
                this.importEdges(pg);

                // Update scale
                this.perfectScale();
            } catch (error) {
				// If an error occured: show it an restore the last working state from history.
                this.emit('blocks.error', error, "Process graph invalid");
                console.log(error);
				this.history.restoreLast();
				success = false;
            }
            
			this.history.enable(true);
			if (addToHistory) {
				this.saveHistory();
            }

            return success;
        },

        importEdges(pg) {
            var nodes = pg.getNodes();
            // iterating using for in loop causes error in edge
            Object.values(nodes).forEach(node => {
                var args = node.getArgumentNames();
                for(let i in args) {
                    var val = node.getRawArgumentValue(args[i]);
                    switch(node.getArgumentType(args[i])) {
                        case 'result':
                            this.addEdge(pg.getNode(val).blockId, "output", node.blockId, args[i], false);
                            break;
                        case 'parameter':
                            // ToDo
                            let paramBlock = this.getPgParameterBlockByName(val);
                            if (paramBlock !== null) {
                                this.addEdge(paramBlock, "output", node.blockId, args[i], false);
                            }
                            break;
                        case 'object':
                        case 'array':
                            this.importEdgeDeep(val, pg, node, args, i);
                            break;
                    }
                }
            });
        },

        importEdgeDeep(val, pg, node, args, i) {
            for(let k in val) {
                if(val[k] && typeof val[k] === "object"){
                    this.importEdgeDeep(val[k], pg, node, args, i);
                }
                else if (!Utils.isRef(val)) {
                    continue;
                }
                else if (val.from_node) {
                    this.addEdge(pg.getNode(val.from_node).blockId, "output", node.blockId, args[i], false);
                }
                else if (val.from_parameter) {
                    let paramBlock = this.getPgParameterBlockByName(val.from_parameter);
                    if (paramBlock !== null) {
                        this.addEdge(paramBlock, "output", node.blockId, args[i], false);
                    }
                }
            }
        },

        importNodes(nodes, x = 0, y = 0, imported = []) {
            var imported;

            for(let i in nodes) {
                var node = nodes[i];
                if (imported.includes(node.id)) {
                    continue; // Node has already been added
                }

                if (typeof node.x === 'number') {
                    x = node.x;
                }

                if (typeof node.y === 'number') {
                    y = node.y;
                }

                var block = this.createBlock(node, x, y);
                imported.push(node.id);

                var size = this.estimateBlockSize(block);
                this.importNodes(node.getNextNodes(), x + size[0] + 20, y, imported);
                y += size[1] + 20;
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
            this.$nextTick(() => {
                if (!this.$refs.div || !Array.isArray(this.$refs.blocks) || this.$refs.blocks.length === 0) {
                    return;
                }

                var xMin = null, xMax = null;
                var yMin = null, yMax = null;

                for (var k in this.$refs.blocks) {
                    var block = this.$refs.blocks[k];
                    var size = this.estimateBlockSize(block);
                    if (xMin == null) {
                        xMin = block.x-15
                        xMax = block.x+size[0]+18;
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
                this.setScale(Math.min(scaleA, scaleB));
                this.setCenter(
                    rect.width/2 - this.state.scale*(xMin+xMax)/2.0,
                    rect.height/2 - this.state.scale*(yMin+yMax)/2.0
                );
                this.newBlockOffset = 0;
            });
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