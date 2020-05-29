<template>
	<div class="visualEditor" ref="visualEditor">
		<EditorToolbar :editable="editable" :onClear="clear">
			<span class="sepr" v-if="editable">
				<button type="button" @click="$refs.blocks.undo()" :disabled="!canUndo" title="Revert last change"><i class="fas fa-undo-alt"></i></button>
				<button type="button" @click="$refs.blocks.redo()" :disabled="!canRedo" title="Redo last reverted change"><i class="fas fa-redo-alt"></i></button>
				<button type="button" @click="$refs.blocks.deleteSelected()" :disabled="!hasSelection" title="Delete selected elements"><i class="fas fa-trash"></i></button>
			</span>
			<span class="sepr" v-if="editable">
				<button type="button" @click="addParameter" title="Add Parameter"><i class="fas fa-parking"></i></button>
			</span>
			<button type="button" @click="$refs.blocks.toggleCompact()" :class="{compactMode: compactMode}" title="Compact Mode"><i class="fas fa-compress-arrows-alt"></i></button>
			<button type="button" @click="$refs.blocks.perfectScale()" title="Scale to perfect size"><i class="fas fa-arrows-alt"></i></button>
			<button type="button" @click="toggleFullScreen()" :title="isFullScreen ? 'Close fullscreen' : 'Show fullscreen'">
				<span v-show="isFullScreen"><i class="fas fa-compress"></i></span>
				<span v-show="!isFullScreen"><i class="fas fa-expand"></i></span>
			</button>
		</EditorToolbar>
		<div class="editorSplitter">
			<DiscoveryToolbar v-if="showDiscoveryToolbar && editable" class="discoveryToolbar" :onAddCollection="insertCollection" :onAddProcess="insertProcess" />
			<div class="graphBuilder" @drop="onDrop($event)" @dragover="allowDrop($event)">
				<Blocks
					ref="blocks"
					:editable="editable"
					:id="id"
					:processes="processRegistry"
					:collections="collections"
					:pgParameters="pgParameters"
					:value="value"
					@input="commit"
					@error="errorHandler"
					@showProcess="id => emit('showProcess', id)"
					@showCollection="id => emit('showCollection', id)"
					@showSchema="showSchemaModal"
					@editParameters="openParameterEditor"
					@compactMode="compact => this.compactMode = compact"
					@selectionChanged="(b, e) => this.hasSelection = (b.length || e.length)"
					@historyChanged="historyChanged"
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
		value: {
			type: Object,
			default: () => null
		},
		pgParameters: {
			type: Array,
			default: () => []
		},
		showDiscoveryToolbar: {
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
			isFullScreen: false
		};
	},
	methods: {
		...Utils.mapActions('userProcesses', {readUserProcess: 'read'}),

		commit(value) {
			this.$emit('input', value);
		},

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

		addParameter() {
			var fields = [
				{
					name: 'name',
					label: 'Parameter name',
					schema: {type: 'string'},
					default: null
				}
			];
			this.emit('showDataForm', "Add Parameter", fields, data => {
				if (typeof data.name === 'string' && data.name.length > 0) {
					this.$refs.blocks.addPgParameter(data);
				}
			});
		},

		showSchemaModal(name, schema) {
			if (!this.$refs.schemaModal) {
				return;
			}
			const msg = "This is a parameter for a user-defined process.\n"
						+ " It is a value made available by the parent entity (usually another process or a secondary web service) that is executing this processes for further use.\n"
						+ "The value will comply to the following data type(s):";
			this.$refs.schemaModal.show(name, schema, msg);
		},

		openParameterEditor(parameters, values, title = "Edit", isEditable = true, selectParameterName = null, saveCallback = null, processId = null) {
			this.$refs.parameterModal.show(title, parameters, values, isEditable, saveCallback, null, processId, selectParameterName);
		},

		clear() {
			if (this.$refs.blocks) {
				this.$refs.blocks.clear();
			}
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
