<template>
	<div id="GraphBuilderEnvironment">
		<div class="sourceHeader">
			<h3></h3>
			<div class="sourceToolbar">
				<button @click="blocks.undo()" class="sep" v-show="blocks.hasUndo()" title="Undo last change"><i class="fas fa-undo-alt"></i></button>
				<button @click="blocks.toggleCompact()" :class="{compactActive: this.blocks.compactMode}" title="Compact Mode"><i class="fas fa-compress-arrows-alt"></i></button>
				<button @click="blocks.perfectScale()" title="Scale to perfect size" class="sep"><i class="fas fa-arrows-alt"></i></button>
				<button @click="convertModel" title="Generate Process Graph"><i class="fas fa-code"></i></button>
			</div>
		</div>
		<div id="pgEditor"></div>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';
import Blocks from './blocks/blocks.js';

export default {
	name: 'GraphBuilderEnvironment',
	props: ['active'],
	data() {
		return {
			blocks: null
		};
	},
	beforeMount() {
		this.blocks = new Blocks(this);
    },
	mounted() {
        this.blocks.run("#pgEditor");

		EventBus.$on('propagateCollections', this.propagateCollections);
		EventBus.$on('propagateProcesses', this.propagateProcesses);
		EventBus.$on('addProcessToEditor', this.insertToEditor);
		EventBus.$on('addCollectionToEditor', this.insertToEditor);
		EventBus.$on('serverChanged', this.resetBlocks);
    },
	methods: {
		getProcessGraph(callback) {
			callback(this.makeProcessGraph());
		},

		convertModel() {
			var pg = this.makeProcessGraph();

			// ToDo: Don't emit separately
			EventBus.$emit('showEditor');
			this.$nextTick(() => {
				EventBus.$emit('addSourceCode', JSON.stringify(pg, null, 2), true);
			})
        },

		resetBlocks() {
			this.blocks.meta = [];
		},

		makeProcessGraph() {
			var data = this.blocks.export();
			var edges = data.edges;
			var nodes = data.blocks;
			var nodesById = {};
			// Make an object of nodes indexed by id
			for (var i in nodes) {
				var id = nodes[i].id;
				nodesById[id] = nodes[i];
			}
			// Find result node (node without connected output)
			// and add references to blocks to edges
			var nodeIdList = Object.keys(nodesById);
			for (i in edges) {
				edges[i].block1ref = nodesById[edges[i].block1];
//				edges[i].block2ref = nodesById[edges[i].block2];
				var index = nodeIdList.indexOf(edges[i].block1.toString());
				if (index > -1) {
					nodeIdList.splice(index, 1);
				}
			}
			if (nodeIdList.length !== 1) {
				alert('Error: There must be exactly one output');
			}
			var startBlockId = nodeIdList[0];

			// Create Process Graph
			var pg = this.makeProcessGraphFromEdges(edges, nodesById[startBlockId]);
			console.log(JSON.stringify(pg, null, 2));
			return pg;
		},

		makeProcessGraphFromEdges(edges, currentNode) {
			if (!currentNode) {
				return {};
			}

			var parents = [];
			for(var i in edges) {
				if (edges[i].block2 == currentNode.id) {
					parents.push(this.makeProcessGraphFromEdges(edges, edges[i].block1ref));
				}
			}
			if (currentNode.module == 'Collection') {
				return {
					process_id: 'get_collection',
					name: currentNode.type
				};
			}
			else {
				var process = currentNode.values;
				if (parents.length == 1) {
					process.imagery = parents[0];
				}
				else {
					process.imagery = parents;
				}
				process.process_id = currentNode.type;
				return process;
			}
		},

		propagateProcesses(processes) {
			for(var i in processes) {
				var field = {
					name: processes[i].name,
					description: processes[i].description,
					module: "process",
				    fields: [
						{
							name: "Output",
							attrs: "output"
						}
					]
				}
				for(var a in processes[i].parameters) {
					var p = processes[i].parameters[a];
					p.name = a;
					p.attrs = a == 'imagery' ? "input" : "editable input"
					field.fields.push(p);
				}
				this.blocks.register(Object.assign(field, processes[i]));
			}
		},
	
		propagateCollections(collection) {
			for(var i in collection) {
				var field = {
					module: "collection",
				    fields: [
						{
							name: "Output",
							attrs: "output"
						}
    				]
				};
				this.blocks.register(Object.assign(field, collection[i]));
			}
		},

		insertToEditor(name) {
			if (!this.active) {
				return;
			}

			this.blocks.addBlock(name, 0, 0);
		}

	}
}
</script>

<style scoped>
.sourceHeader h3 {
	margin-top: 1px;
	float: left;
	width: 65%;
}
.sourceToolbar {
	text-align: right;
	float: right;
	width: 35%;
}
.sourceHeader {
	padding: 5px;
	border-bottom: dotted 1px #676767;
}
.sourceHeader:after {
    content: ".";
    clear: both;
    display: block;
    visibility: hidden;
    height: 0px;
}
#pgEditor {
	height: 400px;
}
.sep {
    margin-right: 0.5em;
}
</style>

<style>
.blocks_js_editor {
    width:100%;
    height:100%;
    position:relative;
}

.blocks_js_editor .blocks {
    overflow:hidden;
}

.blocks_js_editor .canvas {
    position:absolute;
    z-index:1;
}

.blocks_js_editor .blocks {
    overflow:hidden;
    position:absolute;
    z-index:3;
    width:100%;
    height:100%;
}

.compactActive {
    color: green;
}

.blocks_js_editor .block {
    position:absolute;
    border:2px solid #ccc;
    margin-left:0px;
    margin-top:0px;
    background-color:#fafafa;
    opacity:0.8;
    font-size:14px;
    -moz-user-select:none;
    -khtml-user-select:none;
    -webkit-user-select:none;
    -o-user-select:none;
}

.blocks_js_editor .block .description {
    display:none;
    width:200px;
    padding:3px;
    border:1px solid #083776;
    border-radius:5px;
    color:#001531;
    background-color:#91bcf6;
    margin-top:15px;
    position:absolute;
    font-weight:normal;
}

.blocks_js_editor .blockTitle {
	display: flex;
    padding: 0.3em 0.1em;
    font-weight:bold;
    background-color:#ddd;
    margin-bottom: 0.1em;
    cursor: move;
    font-size: 0.9em;
}

.blocks_js_editor .titleText {
	align-self: stretch;
	flex-basis: 100%;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.blocks_js_editor .blockTitle .blockId {
    opacity:0.4;
    margin-left: 2px;
}

.blocks_js_editor .block .blockicon
{
	align-self: flex-end;
	flex-basis: 4.5em;
    min-width: 4.5em;
    text-align: right;
	white-space: nowrap;
}


.blocks_js_editor .block .blockicon svg
{
    min-width: 1.4em;
    cursor: pointer;
    opacity: 0.5;
    margin-left: 0.1em;
}

.blocks_js_editor .block .blockicon svg:hover {
    opacity:1.0;
}

.blocks_js_editor .block_selected {
    border:2px solid #0a0;
}

.blocks_js_editor .block_selected .blockTitle {
    background-color:#0c0;
}

.blocks_js_editor .inout {
	display: flex;
}

.blocks_js_editor .inputs,
.blocks_js_editor .outputs {
    flex: 1;
}

.blocks_js_editor .connector {
    font-size:0.9em;
    margin: 0.2em 0;
    background-repeat:no-repeat;
    cursor:pointer;
    clear:both;
    width:100%;
}

.blocks_js_editor .connector.disabled {
    opacity:0.4;
}

.blocks_js_editor .output {
    text-align:right;
}

.blocks_js_editor .circle {
    width: 0.8em;
    height: 0.8em;
    margin: 0 0.2em;
    border: 1px solid #888;
    background-color: transparent;
    display: inline-block;
}

.blocks_js_editor .circle.io_active {
    background-color: #FFC800;
}

.blocks_js_editor .circle.io_selected {
    background-color: #00C800 !important;
}

.blocks_js_editor input,
.blocks_js_editor textarea
{
    font-family:Courier;
}

.fieldRow {
	display: flex;
	margin-bottom: 0.5em;
}
.fieldRow label {
	flex: 1;
}
.fieldRow .fieldValue {
	flex: 3;
}
.fieldRow .fieldValue input, .fieldRow .fieldValue textarea, .fieldRow .fieldValue select {
	width: 100%;
}
.fieldRow .fieldsArray .pattern {
    display: none;
}
</style>
