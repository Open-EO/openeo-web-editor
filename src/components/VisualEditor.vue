<template>
	<div class="visualEditor" ref="visualEditor">
		<EditorToolbar :editable="editable" :onClear="clear" :isMainEditor="isMainEditor">
			<button type="button" @click="$refs.blocks.undo()" :disabled="!editable || !canUndo" title="Revert last change"><i class="fas fa-undo-alt"></i></button>
			<button type="button" @click="$refs.blocks.redo()" :disabled="!editable || !canRedo" title="Redo last reverted change"><i class="fas fa-redo-alt"></i></button>
			<button type="button" @click="$refs.blocks.deleteSelected()" :disabled="!editable || !hasSelection" title="Delete selected elements"><i class="fas fa-trash"></i></button>
			<button type="button" @click="$refs.blocks.toggleCompact()" :class="{compactMode: compactMode}" title="Compact Mode"><i class="fas fa-compress-arrows-alt"></i></button>
			<button type="button" @click="$refs.blocks.perfectScale()" title="Scale to perfect size"><i class="fas fa-arrows-alt"></i></button>
			<button type="button" @click="toggleFullScreen()" :title="isFullScreen ? 'Close fullscreen' : 'Show fullscreen'">
				<span v-show="isFullScreen"><i class="fas fa-compress"></i></span>
				<span v-show="!isFullScreen"><i class="fas fa-expand"></i></span>
			</button>
		</EditorToolbar>
		<div class="editorSplitter">
			<DiscoveryToolbar v-if="!isMainEditor && editable" class="discoveryToolbar" :onAddCollection="insertCollection" :onAddProcess="insertProcess" :onAddCustomProcess="insertCustomProcess" />
			<div class="graphBuilder" @drop="onDrop($event)" @dragover="allowDrop($event)">
				<Blocks
					ref="blocks"
					:editable="editable"
					:id="id"
					:processes="processRegistry"
					:collections="collections"
					:pgParameters="pgParameters"
					@error="errorHandler"
					@showProcess="id => emit('showProcess', id)"
					@showCollection="id => emit('showCollection', id)"
					@showSchema="showSchemaModal"
					@editParameters="openParameterEditor"
					@compactMode="compact => this.compactMode = compact"
					@selectionChanged="(b, e) => this.hasSelection = (b.length || e.length)"
					@historyChanged="historyChanged"
					v-model="model"
					/>
			</div>
		</div>
		<SchemaModal ref="schemaModal" />
		<ParameterModal ref="parameterModal" />
	</div>
</template>

<script>
import Blocks from './blocks/Blocks.vue';
import Utils from '../utils.js';
import EditorToolbar from './EditorToolbar.vue';
import DiscoveryToolbar from './DiscoveryToolbar.vue';
import ParameterModal from './modals/ParameterModal.vue'; // Add a paremeter modal to each visual editor, otherwise we can't open a parameter modal over a parameter modal (e.g. edit the parameters of a callback)
import SchemaModal from './modals/SchemaModal.vue';
import { ProcessGraph } from '@openeo/js-processgraphs';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';

export default {
	name: 'VisualEditor',
	mixins: [EventBusMixin],
	components: {
		Blocks,
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
			default: () => null
		},
		pgParameters: {
			type: Array,
			default: () => []
		},
		isMainEditor: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		...Utils.mapState(['collections']),
		...Utils.mapGetters(['processRegistry']),
		...Utils.mapGetters('userProcesses', {getProcessById: 'getAllById'})
	},
	data() {
		return {
			canUndo: false,
			canRedo: false,
			compactMode: false,
			hasSelection: false,
			model: this.value || require('../../../openeo-js-processgraphs/tests/assets/evi.json'), // ToDo: Remove
			isFullScreen: false
		};
	},
	mounted() {
		if (this.active) {
			this.onShow();
		}
	},
	watch: {
		model(value) {
			this.$emit('input', value);
		},
		active(newVal) {
			if (newVal) {
				this.onShow();
			}
		}
	},
	methods: {
		...Utils.mapActions('userProcesses', {readUserProcess: 'read'}),

		errorHandler(message, title = null) {
			Utils.exception(this, message, title)
		},

		historyChanged(history, index) {
			this.canUndo = !!history[index-1];
			this.canRedo = !!history[index+1];
		},

		allowDrop(ev) {
			ev.preventDefault();
		},

		onDrop(event) {
			var processId = event.dataTransfer.getData("application/openeo-process");
			var collection = event.dataTransfer.getData("application/openeo-collection");
			var pg = event.dataTransfer.getData("application/openeo-process-graph");
			if (processId) {
				event.preventDefault();
				let process = this.getProcessById(processId);
				if (process != null && !process.native) {
					this.readUserProcess({data: process})
						.then(updated => this.insertProcess(updated.toJSON(), event.pageX, event.pageY))
						.catch(error => Utils.exception(this, error, "Sorry, couldn't fully load custom process."));
				}
				else {
					this.insertProcess(processId, event.pageX, event.pageY);
				}
			}
			else if (collection) {
				event.preventDefault();
				this.insertCollection(collection, event.pageX, event.pageY);
			}
		},

		onShow() {
//			this.insertCustomProcess(this.value);
		},

		toggleFullScreen() {
			var element = this.$refs.visualEditor;
			if (!this.isFullScreen) {
				this.isFullScreen = true;
				element.classList.add('fullscreen');
				this.$refs.blocks.perfectScale();
			}
			else {
				this.isFullScreen = false;
				element.classList.remove('fullscreen');
				this.$refs.blocks.perfectScale();
			}
		},

		showSchemaModal(name, schema) {
			if (!this.$refs.schemaModal) {
				return;
			}
			this.$refs.schemaModal.show(name, schema, "This is a parameter of a user-defined process. It is a value made available by the process executing this sub-processes for further use. The value will comply to the following data type(s):");
		},

		openParameterEditor(parameters, values, title = "Edit", isEditable = true, selectParameterName = null, saveCallback = null, processId = null) {
			this.$refs.parameterModal.show(title, parameters, values, isEditable, saveCallback, null, processId, selectParameterName);
		},

		clear() {
			if (this.$refs.blocks) {
				this.$refs.blocks.clear();
			}
		},

		getCustomProcess(success, failure, passNull = false) {
			if (Utils.isObject(this.model)) {
				try {
					var pg = new ProcessGraph(this.model, this.processRegistry);
					pg.parse();
				} catch(error) {
					failure('Process graph invalid', error);
					return;
				}
			}

			if (this.model !== null || passNull) {
				success(this.model);
			}
			else {
				failure('No model specified.');
			}
		},

		insertCustomProcess(process) {
			this.model = process;
		},

		getCollectionDefaults(id) {
			var collection = this.collections.filter(c => c.id === name);
			if (collection.length === 0) {
				return {};
			}
			var temporal_extent = null;
			var spatial_extent = null;
			if (collection) {
				try {
					spatial_extent = Utils.extentToBBox(collection[0].extent.spatial);
				} catch (error) {
					console.log(error); // Catch invalid responses from back-ends
				}
				try {
					temporal_extent = collection[0].extent.temporal;
				} catch (error) {
					console.log(error); // Catch invalid responses from back-ends
				}
			}
			return {id, spatial_extent, temporal_extent};
		},

		insertCollection(collectionId, x = null, y = null) {
			try {
				var pos = this.$refs.blocks.getPositionForPageXY(x, y);
				this.$refs.blocks.addCollection(collectionId, pos, this.getCollectionDefaults(collectionId));
			} catch(error) {
				Utils.exception(this, error);
			}
		},

		insertProcess(name, x = null, y = null) {
			try {
				var pos = this.$refs.blocks.getPositionForPageXY(x, y);
				this.$refs.blocks.addProcess(name, pos);
			} catch(error) {
				Utils.exception(this, error);
			}
		}

	}
}
</script>

<style>
.visualEditor {
	background-color: white;
	height: 100%;
	display: flex;
	flex-direction: column;
}

.visualEditor .editorSplitter {
	display: flex;
	flex-grow: 1;
	height: 100%;
	overflow: hidden;
}

.visualEditor .discoveryToolbar {
	width: 25%;
	min-width: 150px;
	border-right: 1px solid #ddd;
}
.visualEditor.fullscreen .discoveryToolbar {
	width: 15%;
	min-width: 250px;
}

.graphBuilder {
	height: 100%;
	flex-grow: 1;
}

.visualEditor.fullscreen {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 9990; /* Snotify has 9999 and is intentionally above the fullscreen */
	display: flex;
	flex-direction: column;
}

.visualEditor.fullscreen .editorSplitter {
	height: 100%;
}

.compactMode {
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
</style>
