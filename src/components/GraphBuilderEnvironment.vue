<template>
	<div id="GraphBuilderEnvironment">
		<div class="sourceHeader">
			<h3></h3>
			<div class="sourceToolbar">
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
	mounted() {
		EventBus.$on('propagateCollections', this.propagateCollections);
		EventBus.$on('propagateProcesses', this.propagateProcesses);
		EventBus.$on('addProcessToEditor', this.insertToEditor);
		EventBus.$on('addCollectionToEditor', this.insertToEditor);
		EventBus.$on('serverChanged', this.resetBlocks);
		
		this.resetBlocks();
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
			if (this.blocks == null) {
				this.blocks = new Blocks();
				this.blocks.run("#pgEditor");
			}
			else {
				this.blocks.meta = [];
			}
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
				var args = [{
					name: "Output",
					attrs: "output"
				}];
				for(var a in processes[i].parameters) {
					var p = processes[i].parameters[a];
					args.push({
						name: a,
						attrs: a == 'imagery' ? "input" : "editable input"
					});
				}
				this.blocks.register({
					name: processes[i].name,
					description: processes[i].description,
					family: "Process",
					module: "Process",
				    fields: args
				});
			}
		},
	
		propagateCollections(info) {
			for(var i in info) {
				this.blocks.register({
					name: info[i].name,
					family: "Collection",
					module: "Collection",
				    fields: [
						{
							name: "Output",
							attrs: "output"
						}
    				]
				});
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
</style>

<style>
/* block.js */
.blocks_js_editor * {
    padding:0;
    margin:0;
}

.blocks_js_editor {
    width:100%;
    height:100%;
    position:relative;
}

.blocks_js_editor .blocks {
    overflow:hidden;
}

.blocks_js_editor svg {
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

/**
 * Menu bar
 */

.blocks_js_editor .menubar {
    width:100%;
    height:30px;
    z-index:1;
}

.blocks_js_editor .contextmenu,
.blocks_js_editor .childs {
    width:200px;
    padding:0px;
    position:absolute;
    display:none;
    float:left;
    z-index:99;
    box-shadow:0px 0px 5px #666;
    border:1px solid #aaa;
    background-color:#fff;
}

.blocks_js_editor .menubar .add span {
    color:green;
}

.blocks_js_editor .contextmenu .type,
.blocks_js_editor .contextmenu .menuentry,
.blocks_js_editor .contextmenu .family {
    font-size:14px;
    padding:1px;
    cursor:pointer;
    background-color:#fff;
    height:18px;
    color:#666;
    border-left:1px solid #aaa;
    border-right:1px solid #aaa;
    border-top:none;
    border-bottom:none;
    margin-left:-1px;
    margin-right:-1px;
    background-repeat:repeat-x;
    padding:3px;
}

.blocks_js_editor .contextmenu .menu_icon
{
    width:16px;
    height:16px;
    float:left;
    background-repeat:no-repeat;
    margin-right:3px;
}

.blocks_js_editor .contextmenu .menu_icon_compact
{
    background-image:url('../assets/blocks/compact.png');
}

.blocks_js_editor .contextmenu .menu_icon_scale
{
    background-image:url('../assets/blocks/scale.png');
}

.blocks_js_editor .contextmenu .menuentry:hover,
.blocks_js_editor .contextmenu .type:hover {
    background-color: #f7f7f7;
    color:black;
}

.blocks_js_editor .contextmenu .family {
	display: none;
}

/**
 * Blocks
 */

.blocks_js_editor .block {
    position:absolute;
    background-image:url('../assets/blocks/blockFade.png');
    background-repeat:repeat-x;
    border:2px solid #fafafa;
    box-shadow:5px 5px 10px #aaa;
    padding:1px;
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
    font-weight:bold;
    background-color:#ddd;
    background-image:url('../assets/blocks/titleFade.png');
    background-repeat:repeat-x;
    padding:1px;
    margin:-1px;
    margin-bottom:2px;
    cursor:move;
    font-size:80%;
}

.blocks_js_editor .blockTitle .blockId {
    opacity:0.4;
}

.blocks_js_editor .block .blockicon
{
    margin:0;
    padding:0;
    width:14px;
    height:14px;
    float:right;
    cursor:pointer;
    opacity:0.5;
    margin-right:2px;
}

.blocks_js_editor .block .blockicon:hover {
    opacity:1.0;
}

.blocks_js_editor .block .settings {
    background-image:url('../assets/blocks/settings.png');
}

.blocks_js_editor .block .delete {
    background-image:url('../assets/blocks/delete.png');
}

.blocks_js_editor .block .info {
    background-image:url('../assets/blocks/info.png');
}

.blocks_js_editor .block_selected {
    border:2px solid #0a0;
}

.blocks_js_editor .block_selected .blockTitle {
    background-color:#0c0;
}

.blocks_js_editor .inputs,
.blocks_js_editor .outputs {
    width:80px;
}

.blocks_js_editor .outputs {
    float:right;
}

.blocks_js_editor .inputs {
    float:left;
}

.blocks_js_editor .inputs.loopable {
    float:right;
}

.blocks_js_editor .outputs.loopable {
    float:left;
}

.blocks_js_editor .connector {
    font-size:80%;
    padding-top:2px;
    background-repeat:no-repeat;
    cursor:pointer;
    clear:both;
    width:130px;
}

.blocks_js_editor .connector.disabled {
    opacity:0.4;
}

.blocks_js_editor .output {
    text-align:right;
}

.blocks_js_editor .circle {
    width:12px;
    height:12px;
    background-image:url('../assets/blocks/circle.png');
    background-size:12px 12px;
}

.blocks_js_editor .circle.io_active {
    background-image:url('../assets/blocks/circle_full.png');
}

.blocks_js_editor .circle.io_selected {
    background-image:url('../assets/blocks/circle_selected.png') !important;
}

.blocks_js_editor input,
.blocks_js_editor textarea
{
    font-family:Courier;
}

.blocks_js_editor .input,
.blocks_js_editor .loopable .output
{
    float:left;
}

.blocks_js_editor .input .circle,
.blocks_js_editor .loopable .output .circle,
.blocks_js_editor .parameter .circle {
    float:left;
    margin:1px;
}

.blocks_js_editor .input .circle.io_active,
.blocks_js_editor .loopable .output .circle.io_active
{
    float:left;
    margin:1px;
}

.blocks_js_editor .output,
.blocks_js_editor .loopable .input {
    float:right;
}

.blocks_js_editor .output .circle,
.blocks_js_editor .loopable .input .circle
{
    float:right;
    margin:1px;
}

.blocks_js_editor .block .parameters {
    display:none;
    position:absolute;
    border:2px solid #aaa;
    padding:3px;
    z-index:50;
    width:250px;
    margin-left:-5px;
    margin-top:-5px;
    background-color:white;
}

/**
 * Messages
 */
.blocks_js_editor .messages {
    display:none;
    width:350px;
    position:absolute;
    z-index:100;
}

.blocks_js_editor .message {
    padding:5px;
    font-size:14px;
    cursor:pointer;
    border:3px solid;
    border-radius:5px;
}

.blocks_js_editor .messages ul {
    list-style:circle;
    margin-left:20px;
}

.blocks_js_editor .message.error {
    color:red;
    border-color:red;
    background-color:#ffe3e3;
}

.blocks_js_editor .message.valid {
    color:green;
    border-color:green;
    background-color:#eeffee;
}

.blocks_js_modal button {
    margin:5px;
    padding:2px;
    cursor:pointer;
    border:0;
    color:#222;
    font-size:18px;
}

.blocks_js_modal button.close {
    color:white;
    background-color:#ff4646;
}

.blocks_js_modal button.save {
    color:white;
    background-color:#21c40c;
    float:right;
}

.blocks_js_modal input, 
.blocks_js_modal select,
.blocks_js_modal textarea {
    width:250px;
    padding:2px;
    border:1px solid #aaa;
    border-radius:2px;
    background-color:#fafafa;
    margin:2px;
}

.blocks_js_modal textarea {
    width:400px;
    height:110px;
}

.blocks_js_modal .fieldsArray .pattern {
    display:none;
}
</style>
