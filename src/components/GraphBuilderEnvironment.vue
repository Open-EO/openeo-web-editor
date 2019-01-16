<template>
	<div id="GraphBuilderEnvironment">
		<div class="sourceHeader">
			<h3>Visual Process Graph Builder</h3>
			<div class="sourceToolbar">
				<button @click="convertModel" title="Generate Process Graph"><i class="fas fa-code"></i></button>
			</div>
		</div>
		<div id="pgEditor"></div>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';

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
				EventBus.$emit('addSourceCode', "window.ProcessGraph = " + JSON.stringify(pg, null, 2), true);
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
