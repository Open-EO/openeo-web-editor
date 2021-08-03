<template>
	<div class="visualEditor" ref="visualEditor">
		<div class="sourceHeader">
			<strong v-if="title">{{ title }}</strong>
			<div class="sourceToolbar">
				<span class="sepr" v-if="editable">
					<button type="button" @click="confirmClear" title="New script / Clear current script"><i class="fas fa-file"></i></button>
					<slot name="file-toolbar"></slot>
				</span>
				<span class="sepr" v-if="editable">
					<button type="button" @click="$refs.blocks.undo()" :disabled="!canUndo" title="Revert last change"><i class="fas fa-undo-alt"></i></button>
					<button type="button" @click="$refs.blocks.redo()" :disabled="!canRedo" title="Redo last reverted change"><i class="fas fa-redo-alt"></i></button>
					<button type="button" @click="$refs.blocks.deleteSelected()" :disabled="!hasSelection" title="Delete selected elements"><i class="fas fa-trash"></i></button>
				</span>
				<span class="sepr" v-if="editable">
					<button type="button" @click="addParameter" title="Add Parameter"><i class="fas fa-parking"></i></button>
					<button type="button" v-if="supportsMath" :class="{highlightFormula: isMath}" @click="showExpressionModal" title="Insert/Edit formula"><i class="fas fa-square-root-alt"></i></button>
				</span>
				<button type="button" @click="$refs.blocks.toggleCompact()" :class="{compactMode: compactMode}" title="Compact Mode"><i class="fas fa-compress-arrows-alt"></i></button>
				<button type="button" @click="$refs.blocks.perfectScale()" title="Scale to perfect size"><i class="fas fa-arrows-alt"></i></button>
				<FullscreenButton :element="() => this.$refs.visualEditor" @changed="enabled => {this.$refs.blocks.perfectScale(); isFullScreen = enabled}" />
				<slot name="toolbar"></slot>
			</div>
		</div>
		<div class="editorSplitter">
			<DiscoveryToolbar v-if="(showDiscoveryToolbar || isFullScreen) && editable" class="discoveryToolbar" :onAddProcess="insertProcess" />
			<div class="graphBuilder" @drop="onDrop" @dragover="allowDrop">
				<ModelBuilder
					ref="blocks"
					:editable="editable"
					:id="id"
					:processes="processRegistry"
					:collections="collections"
					:parent="parent"
					:parentSchema="parentSchema"
					:value="value"
					@input="commit"
					@error="errorHandler"
					@showProcess="id => emit('showProcess', id)"
					@showCollection="id => emit('showCollection', id)"
					@showParameter="param => emit('showProcessParameter', param)"
					@editParameter="editParameter"
					@editArguments="openArgumentEditor"
					@compactMode="compact => this.compactMode = compact"
					@selectionChanged="selectionChanged"
					@historyChanged="historyChanged"
					/>
			</div>
		</div>
	</div>
</template>

<script>
import ModelBuilder from '@openeo/vue-components/components/ModelBuilder.vue';
import Utils from '../utils.js';
import DiscoveryToolbar from './DiscoveryToolbar.vue';
import EventBusMixin from './EventBusMixin.vue';
import FullscreenButton from './FullscreenButton.vue';

export default {
	name: 'VisualEditor',
	mixins: [EventBusMixin],
	components: {
		ModelBuilder,
		DiscoveryToolbar,
		FullscreenButton
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
		parent: {
			type: Object,
			default: null
		},
		parentSchema: {
			type: Object,
			default: null
		},
		showDiscoveryToolbar: {
			type: Boolean,
			default: false
		},
		title: {
			type: String
		},
		defaultValue: {}
	},
	computed: {
		...Utils.mapState(['collections']),
		...Utils.mapGetters(['processRegistry']),
		...Utils.mapGetters('userProcesses', ['supportsMath', 'isMathProcess'])
	},
	data() {
		return {
			canUndo: false,
			canRedo: false,
			compactMode: false,
			hasSelection: false,
			isMath: false,
			isFullScreen: false
		};
	},
	watch: {
		value(value) {
			this.isMath = this.isMathProcess(value);
		}
	},
	methods: {
		commit(value) {
			// Fix #115: Return the default value/null if no nodes are given
			if (typeof this.defaultValue !== 'undefined' && Utils.isObject(value) && Utils.size(value.process_graph) === 0) {
				value = this.defaultValue;
			}
			this.$emit('input', value);
		},
		errorHandler(message, title = null) {
			Utils.exception(this, message, title)
		},
		selectionChanged(blocks, edges) {
			this.hasSelection = Boolean(blocks.filter(block => block.$el.allowsDelete).length || edges.length);
		},
		historyChanged(history, index) {
			this.canUndo = !!history[index-1];
			this.canRedo = !!history[index+1];
		},
		allowDrop(event) {
			event.preventDefault();
		},
		onDrop(event) {
			var editorNodeJson = event.dataTransfer.getData("application/vnd.openeo-node");
			if (editorNodeJson) {
				let node = JSON.parse(editorNodeJson);
				this.insertProcess(node, event.pageX, event.pageY);
				return event.preventDefault();
			}

			// Read a JSON file that has been dropped
			let files = event.dataTransfer.files;
			if (files.length === 1) {
				let file = event.dataTransfer.files[0];
				if (file.type === 'application/json') {
					var reader = new FileReader();
					reader.onload = async e => {
						try {
							let process = JSON.parse(e.target.result);
							await this.$refs.blocks.import(process);
						} catch(error) {
							Utils.exception(this, error, "Parsing JSON file failed");
						}
					};
					reader.onerror = error => {
						Utils.exception(this, error, "Reading JSON file failed");
					};
					reader.readAsText(file, "UTF-8");
					return event.preventDefault();
				}
			}
		},
		getNameField(value = undefined) {
			return {
				value,
				name: 'name',
				label: 'Name',
				schema: {type: 'string'},
				default: null
			};
		},
		getDescriptionField(value = undefined) {
			return {
				value,
				name: 'description',
				label: 'Description',
				schema: {
					type: 'string',
					subtype: 'commonmark'
				}
			};
		},
		getOptionalField(value = undefined) {
			return {
				value,
				name: 'optional',
				label: 'Optional',
				optional: true,
				schema: {
					type: 'boolean'
				},
				default: false
			};
		},
		getExperimentalField(value = undefined) {
			return {
				value,
				name: 'experimental',
				label: 'Experimental',
				optional: true,
				schema: {
					type: 'boolean'
				},
				default: false
			};
		},
		getDeprecatedField(value = undefined) {
			return {
				value,
				name: 'deprecated',
				label: 'Deprecated',
				optional: true,
				schema: {
					type: 'boolean'
				},
				default: false
			};
		},
		getDefaultField(value = undefined) {
			return {
				value,
				name: 'default',
				label: 'Default Value',
				optional: true,
				schema: {}
			};
		},
		getSchemaField(value = undefined) {
			let subtype = !value ? 'openeo-datatype' : 'json-schema';
			return {
				value,
				name: 'schema',
				label: 'Data Types',
				description: 'Allowed data type(s) for this parameter as JSON Schema.',
				schema: [
					{
						title: 'Single data type',
						type: 'object',
						subtype
					},
					{
						title: 'Multiple data types',
						type: 'array',
						minItems: 1,
						items: {
							type: 'object',
							subtype
						}
					}
				]
			};
		},
		addParameter() {
			var fields = [
				this.getNameField(),
				this.getDescriptionField(),
				this.getOptionalField(),
				this.getExperimentalField(),
				this.getDeprecatedField(),
				this.getDefaultField(),
				this.getSchemaField()
			];
			this.emit('showDataForm', "Add Parameter", fields, async data => {
				if (typeof data.name === 'string' && data.name.length > 0) {
					await this.$refs.blocks.addPgParameter(data);
				}
			});
		},
		editParameter(parameter, title = "Edit Parameter", saveCallback = null) {
			var fields = [
				this.getNameField(parameter.name),
				this.getDescriptionField(parameter.description),
				this.getOptionalField(parameter.optional),
				this.getExperimentalField(parameter.experimental),
				this.getDeprecatedField(parameter.deprecated),
				this.getDefaultField(parameter.default),
				this.getSchemaField(parameter.schema)
			];
			this.emit('showDataForm', title, fields, saveCallback);
		},
		showExpressionModal() {
			let props = {
				process: this.value,
				pgParameters: this.$refs.blocks.getPgParameters()
			};
			let events = {
				save: this.insertNodes
			};
			this.emit('showModal', 'ExpressionModal', props, events);
		},
		openArgumentEditor(parameters, data, title = "Edit", editable = true, selectParameterName = null, saveCallback = null, parent = null) {
			let props = {
				title,
				parameters,
				data,
				editable,
				selectParameterName,
				parent
			};
			let events = {};
			if (typeof saveCallback === 'function') {
				events.save = saveCallback;
			}
			this.emit('showModal', 'ParameterModal', props, events);
		},
		confirmClear() {
			var confirmed = confirm("Do you really want to clear the existing model?");
			if (confirmed) {
				this.clear();
			}
		},
		clear() {
			if (this.$refs.blocks) {
				this.$refs.blocks.clear();
			}
			this.commit(null);
		},
		insertProcess(node, x = null, y = null) {
			try {
				var pos = this.$refs.blocks.getPositionForPageXY(x, y);
				this.$refs.blocks.addProcess(node.process_id, node.arguments, pos);
			} catch(error) {
				Utils.exception(this, error);
			}
		},
		async insertNodes(nodes, replace = false) {
			return await this.$refs.blocks.import({
				process_graph: nodes
			}, {
				clear: replace
			});
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

.visualEditor .vue-component.model-builder {
	min-height: 100px;
	min-width: 100px;
}

.visualEditor .editorSplitter {
	display: flex;
	flex-direction: row-reverse;
	flex-grow: 1;
	height: 100%;
	overflow: hidden;
}

.visualEditor .discoveryToolbar {
	width: 25%;
	min-width: 150px;
	border-left: 1px solid #ddd;
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
	display: flex;
	flex-direction: column;
}

.visualEditor.fullscreen .editorSplitter {
	height: 100%;
}

.compactMode {
	color: green;
}

@keyframes glowing {
  0% {
    box-shadow: 0 0 3px green;
  }
  50% {
    box-shadow: 0 0 10px green;
  }
  100% {
    box-shadow: 0 0 3px green;
  }
}

.highlightFormula {
    animation: glowing 1500ms infinite;
}
</style>
