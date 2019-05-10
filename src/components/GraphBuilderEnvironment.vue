<template>
	<div id="GraphBuilderEnvironment">
		<div :id="fieldId" class="graphBuilder"></div>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';
import Blocks from './blocks/blocks.js';
import Utils from '../utils.js';

export default {
	name: 'GraphBuilderEnvironment',
	props: {
		active: {
			type: Boolean,
			default: true
		},
		processes: Array,
		collections: Array,
		fieldId: String
	},
	data() {
		return {
			blocks: null
		};
	},
	beforeMount() {
		this.blocks = new Blocks(this.errorHandler);
    },
	mounted() {
        this.blocks.run("#" + this.fieldId);

		EventBus.$on('addProcessToEditor', this.insertProcess);
		EventBus.$on('addCollectionToEditor', this.insertCollection);
		EventBus.$on('insertProcessGraph', this.insertProcessGraph);
		EventBus.$on('clearProcessGraph', this.clearProcessGraph);
	},
	watch: {
		processes(processes) {
			this.blocks.unregisterProcesses();
			for(var i in processes) {
				this.blocks.registerProcess(processes[i]);
			}
		},
		collections(collections) {
			this.blocks.unregisterCollections();
			for(var i in collections) {
				this.blocks.registerCollection(collections[i]);
			}
		}
	},
	methods: {
		errorHandler(message, title = null) {
    		Utils.exception(this, message, title);
		},

		clearProcessGraph() {
			this.blocks.clear();
		},

		getProcessGraph(callback, silent = false, passNull = false) {
			var pg = this.makeProcessGraph(silent);
			if (pg !== null || passNull) {
				callback(pg);
			}
			else if (!silent) {
				Utils.error(this, 'No valid model specified.');
			}
		},

		makeModel(processGraph) {
			var success = true;
			this.blocks.history.save(); // Store current state only once and then...
			this.blocks.clear(); // clear screen...
			this.blocks.history.enable(false); // disable history for import so that not every import step is in the history...
			try {
				// import process graph and scale it "perfectly"! :-)
				this.blocks.importProcessGraph(processGraph);
            	this.blocks.perfectScale();
			} catch (error) {
				// If an error occured: show it an restore the last working state from history.
				Utils.exception(this, error, "Process graph invalid");
				this.blocks.history.restoreLast();
				success = false;
			}
			// Finally, enable history again.
			this.blocks.history.enable(true);
			return success;
		},

		makeProcessGraph(silent = false) {
			try {
				return this.blocks.exportProcessGraph();
			} catch (error) {
				if (!silent) {
					Utils.exception(this, error);
				}
				else {
					console.log(error);
				}
				return null;
			}
		},

		insertProcessGraph(pg) {
			if (!this.active || !pg) {
				return;
			}

			this.makeModel(pg);
		},

		insertCollection(name) {
			if (!this.active) {
				return;
			}

			try {
				this.blocks.addCollection(name, 0, 0);
			} catch(error) {
				Utils.exception(this, error);
			}
		},

		insertProcess(name) {
			if (!this.active) {
				return;
			}

			try {
				this.blocks.addProcess(name, 0, 0);
			} catch(error) {
				Utils.exception(this, error);
			}
		}

	}
}
</script>

<style>
.graphBuilder {
	height: 400px;
}

.blocks_js_editor {
    width: 100%;
    height: 100%;
    position: relative;
}

.blocks_js_editor .blocks {
    overflow: hidden;
}

.blocks_js_editor .canvas {
    position: absolute;
    z-index: 1;
}

.blocks_js_editor .blocks {
    overflow: hidden;
    position: absolute;
    z-index: 3;
    width: 100%;
    height: 100%;
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
	flex-grow: 1;
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

.blocks_js_editor .inputs {
    flex-grow: 1;
}

.blocks_js_editor .connector {
    font-size:0.9em;
    margin: 0.2em 0;
    background-repeat:no-repeat;
    cursor:pointer;
    width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
}

.blocks_js_editor .connector.noValue {
    color: red;
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

.blocks_js_editor .circle.result {
    background-color: #888 !important;
}

.blocks_js_editor input,
.blocks_js_editor textarea
{
    font-family:Courier;
}
</style>
