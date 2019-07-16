<template>
	<div id="VisualEditor" ref="visualEditor">
		<EditorToolbar :editable="editable" :onStore="getProcessGraph" :onInsert="insertProcessGraph" :onClear="clearProcessGraph" :enableClear="enableClear" :enableExecute="enableExecute" :enableLocalStorage="enableLocalStorage">
			<button type="button" @click="blocks.deleteEvent()" v-show="editable && blocks.canDelete()" title="Delete selected elements"><i class="fas fa-trash"></i></button>
			<button type="button" @click="blocks.undo()" v-show="editable && blocks.hasUndo()" title="Undo last change"><i class="fas fa-undo-alt"></i></button>
			<button type="button" @click="blocks.toggleCompact()" :class="{compactActive: blocks.compactMode}" title="Compact Mode"><i class="fas fa-compress-arrows-alt"></i></button>
			<button type="button" @click="perfectScale()" title="Scale to perfect size"><i class="fas fa-arrows-alt"></i></button>
			<button type="button" @click="toggleFullScreen()" :title="isFullScreen ? 'Close fullscreen' : 'Show fullscreen'">
				<span v-show="isFullScreen"><i class="fas fa-compress"></i></span>
				<span v-show="!isFullScreen"><i class="fas fa-expand"></i></span>
			</button>
		</EditorToolbar>
		<div :id="id" class="graphBuilder"></div>
		<DiscoveryToolbar v-if="editable" :onAddCollection="insertCollection" :onAddProcess="insertProcess" />
		<SchemaModal ref="schemaModal" />
		<ParameterModal ref="parameterModal" />
	</div>
</template>

<script>
import EventBus from '../eventbus.js';
import Blocks from './blocks/blocks.js';
import Utils from '../utils.js';
import EditorToolbar from './EditorToolbar.vue';
import DiscoveryToolbar from './DiscoveryToolbar.vue';
import ParameterModal from './ParameterModal.vue'; // Add a paremeter modal to each visual editor, otherwise we can't open a parameter modal over a parameter modal (e.g. edit the parameters of a callback)
import SchemaModal from './SchemaModal.vue';
import { ProcessGraph } from '@openeo/js-commons';

export default {
	name: 'VisualEditor',
	components: {
		EditorToolbar,
		DiscoveryToolbar,
		ParameterModal,
		SchemaModal
	},
	props: {
		id: String,
		editable: {
			type: Boolean,
			default: true
		},
		active: {
			type: Boolean,
			default: true
		},
		value: {
			type: Object,
			default: null
		},
		callbackArguments: {
			type: Object
		},
		enableClear: {
			type: Boolean,
			default: true
		},
		enableLocalStorage: {
			type: Boolean,
			default: true
		},
		enableExecute: {
			type: Boolean,
			default: true
		}
	},
	computed: {
		...Utils.mapState('server', ['processes', 'collections']),
		...Utils.mapGetters('server', ['processRegistry'])
	},
	data() {
		return {
			blocks: null,
			isFullScreen: false
		};
	},
	beforeMount() {
		this.blocks = new Blocks(
			this.errorHandler,
			(blocks, fields, editable) => this.openParameterEditor(blocks, fields, editable)
		);
	},
	mounted() {
		this.$nextTick(this.initBlocks);
		EventBus.$on('showSchemaModal', this.showSchemaModal);
	},
	watch: {
		processes() {
			this.registerProcesses();
		}
	},
	methods: {
		initBlocks() {
			this.blocks.run("#" + this.id, this.editable);

			this.registerProcesses();
			this.makeCallbackArguments();
			this.insertProcessGraph(this.value, false);
		},

		perfectScale() {
			this.blocks.perfectScale();
			this.$forceUpdate();
		},

		toggleFullScreen() {
			var element = this.$refs.visualEditor;
			if (!this.isFullScreen) {
				this.isFullScreen = true;
				element.classList.add('fullscreen');
				this.perfectScale();
			}
			else {
				this.isFullScreen = false;
				element.classList.remove('fullscreen');
				this.perfectScale();
			}
		},

		errorHandler(message, title = null) {
			Utils.exception(this, message, title);
		},

		showSchemaModal(name, schema) {
			if (!this.$refs.schemaModal) {
				return;
			}
			this.$refs.schemaModal.show(name, schema, "This is a callback argument. It is a value made available by the process executing this sub-processes for further use. The value will comply to the following data type(s):");
		},

		openParameterEditor(blocks, fields, editable) {
			blocks.active = false;
			var title = fields.block.name+' #'+fields.block.id;
			this.$refs.parameterModal.show(
				title, fields.editables, editable,
				// save handler
				editable ? (data => fields.save(data)) : null,
				// close handler
				() => {
					blocks.active = true;
					return true;
				},
				// process id
				fields.block.name
			);
		},

		clearProcessGraph() {
			this.blocks.clear();
			this.makeCallbackArguments();
		},

		registerProcesses() {
			this.blocks.unregisterProcesses();
			for(var i in this.processes) {
				this.blocks.registerProcess(this.processes[i]);
			}

			this.blocks.unregisterCallbackArguments();
			for(var name in this.callbackArguments) {
				this.blocks.registerCallbackArgument(name, this.callbackArguments[name]);
			}
		},

		getProcessGraph(success, failure, passNull = false) {
			var processGraph = null;
			try {
				processGraph = this.makeProcessGraph();
			} catch (error) {
				failure('No valid model specified.', error);
				return;
			}

			if (processGraph !== null) {
				try {
					var pg = new ProcessGraph(processGraph, this.processRegistry);
					pg.parse();
				} catch(error) {
					failure('Process graph invalid', error);
					return;
				}
			}

			if (processGraph !== null || passNull) {
				success(processGraph);
			}
			else {
				failure('No model specified.');
			}
		},

		makeModel(processGraph, addToHistory = true) {
			var success = true;
			if (addToHistory) {
				this.blocks.history.save(); // Store current state only once and then...
			}
			this.blocks.clear(); // clear screen...
			this.blocks.history.enable(false); // disable history for import so that not every import step is in the history...
			try {
				// import process graph and scale it "perfectly"! :-)
				this.makeCallbackArguments();
				this.blocks.importProcessGraph(processGraph, this.processRegistry);
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

		makeProcessGraph() {
			return this.blocks.exportProcessGraph();
		},

		makeCallbackArguments() {
			var i = 0;
			for(var name in this.callbackArguments) {
				this.insertCallbackArgument(name, i++);
			}
		},

		insertProcessGraph(pg, addToHistory = true) {
			if (!pg) {
				this.clearProcessGraph();
				return;
			}

			this.makeModel(pg, addToHistory);
		},

		insertCollection(name) {
			try {
				this.blocks.addCollection(name);
			} catch(error) {
				Utils.exception(this, error);
			}
		},

		insertProcess(name) {
			try {
				this.blocks.addProcess(name);
			} catch(error) {
				Utils.exception(this, error);
			}
		},

		insertCallbackArgument(name, num) {
			try {
				this.blocks.addCallbackArgument(name, -150, num * 50);
			} catch(error) {
				Utils.exception(this, error);
			}
		},

	}
}
</script>

<style>
#VisualEditor {
	background-color: white;
}

#VisualEditor.fullscreen {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 8000;
	display: flex;
	flex-direction: column;
}

.graphBuilder {
	height: 400px;
}
#VisualEditor.fullscreen .graphBuilder {
	flex-grow: 1;
}

.compactActive {
	color: green;
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

.blocks_js_editor .block_collection {
	border:2px solid #6B8DAF;
}

.blocks_js_editor .block_collection .blockTitle {
	background-color:#A3B7CC;
}

.blocks_js_editor .hide_collection_id {
	display: none;
}

.blocks_js_editor .block_argument {
	border:2px solid #B28C6B;
}

.blocks_js_editor .block_argument .blockTitle {
	background-color:#CCB7A3;
}

.blocks_js_editor .block_selected {
	border:2px solid #0a0 !important; /* important  is used to override the styles for block_collection and block_argument above */
}

.blocks_js_editor .block_selected .blockTitle {
	background-color:#0c0 !important;
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
