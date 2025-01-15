<template>
	<div class="visualEditor" ref="visualEditor">
		<div class="sourceHeader">
			<strong v-if="title">{{ title }}</strong>
			<div class="sourceToolbar">
				<span class="sepr" v-if="editable">
					<BButton @click="confirmClear" title="Start from scratch - Clears the current script"><i class="fas fa-file"></i></BButton>
					<slot name="file-toolbar"></slot>
				</span>
				<span class="sepr" v-if="editable">
					<BButton @click="$refs.blocks.undo()" :disabled="!canUndo" title="Revert the last change"><i class="fas fa-undo-alt"></i></BButton>
					<BButton @click="$refs.blocks.redo()" :disabled="!canRedo" title="Redo the last reverted change"><i class="fas fa-redo-alt"></i></BButton>
					<BButton @click="$refs.blocks.deleteSelected()" :disabled="!hasSelection" title="Delete the selected elements from the process"><i class="fas fa-trash"></i></BButton>
				</span>
				<span class="sepr" v-if="editable">
					<BButton v-if="!parent" @click="() => editProcess(value)" title="Edit the process metadata"><i class="fas fa-edit"></i></BButton>
					<BButton @click="addParameter" title="Add a parameter to the process"><i class="fas fa-parking"></i></BButton>
					<BButton v-if="supportsMath" :class="{highlightFormula: isMath}" @click="showExpressionModal" title="Insert or edit a formula as part of the process"><i class="fas fa-square-root-alt"></i></BButton>
				</span>
				<BButton @click="$refs.blocks.toggleCompact()" :class="{compactMode: compactMode}" :title="compactMode ? 'Show the process more compact and less detailed' : 'Shows the process less compact and more detailed'"><i class="fas fa-compress-arrows-alt"></i></BButton>
				<BButton @click="$refs.blocks.perfectScale()" title="Scale the view to match the available space"><i class="fas fa-arrows-alt"></i></BButton>
				<FullscreenButton :element="() => this.$refs.visualEditor" @changed="enabled => {this.$refs.blocks.perfectScale(); isFullScreen = enabled}" />
				<slot name="toolbar"></slot>
			</div>
		</div>
		<div class="editorSplitter">
			<DiscoveryToolbar v-if="(showDiscoveryToolbar || isFullScreen) && editable" class="discoveryToolbar" :onAddProcess="insertProcess" />
			<div class="graphBuilder" @drop="onDrop" @dragover="allowDrop">
				<div v-if="showHelpOverlay" class="model-overlay">
					<h2>Welcome!</h2>
					<p>
						What you are seeing in this area is the visual model builder.
						You can start building your model by dragging collections, processes etc. from the left area and dropping them here.
						</p>
					<p>
						Alternatively, you can also import existing processes into the model builder:
						<ul>
							<li v-if="canPaste">Paste the JSON from your clipboard by clicking <BButton @click="paste" title="Paste a process from your clipboard"><i class="fas fa-paste"></i></BButton> or use <kbd>CTRL</kbd> + <kbd>V</kbd> (Windows, Linux) or <kbd>⌘</kbd> + <kbd>V</kbd> (MacOS) when the model builder is in focus.</li>
							<li>Drag and drop a JSON file from your computer</li>
							<li>Import a JSON file from your computer or another source such as the internet by clicking <BButton @click="importProcess" title="Import a process from an external source"><i class="fas fa-cloud-download-alt"></i></BButton></li>
						</ul>
					</p>
					<p>
						You can also import the processes from the Python and R client.
						You need to export your process to JSON first:
						<ul>
							<li>In Python use <a href="https://open-eo.github.io/openeo-python-client/cookbook/tricks.html#process-graph-export" target="_blank"><code>print(result.to_json())</code></a></li>
							<li>In R use <a href="https://open-eo.github.io/openeo-r-client/reference/index.html" target="_blank"><code>toJSON(as(result, "Process"))</code></a></li>
						</ul>
						In both cases, <code>result</code> is your last return value from a data cube process such as <code>save_result</code>.
						For more details, please read the corresponding chapter in the <a href="https://openeo.org/documentation/1.0/cookbook/#output-process-as-json" target="_blank">openEO cookbook</a>.
					</p>
					<p>Once you start interacting with this area, this message will disappear.</p>
				</div>
				<ModelBuilder
					ref="blocks"
					:editable="editable"
					:id="id"
					:processes="processes"
					:collections="collections"
					:parent="parent"
					:parentSchema="parentSchema"
					:value="value"
					@input="commit"
					@error="errorHandler"
					@showProcess="(id, namespace) => broadcast('showProcess', {id, namespace})"
					@showCollection="id => broadcast('showCollection', id)"
					@showParameter="(param, origin) => broadcast('showProcessParameter', param, origin)"
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
import EventBusMixin from './EventBusMixin.js';
import FullscreenButton from './FullscreenButton.vue';
import BButton from '@openeo/vue-components/components/internal/BButton.vue';
import { ProcessParameter } from '@openeo/js-commons';
import JavaScript from '../export/javascript';

export default {
	name: 'VisualEditor',
	mixins: [EventBusMixin],
	components: {
		BButton,
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
		showIntro: {
			type: Boolean,
			default: false
		},
		title: {
			type: String
		},
		defaultValue: {}
	},
	computed: {
		...Utils.mapState(['connection', 'collections']),
		...Utils.mapGetters(['processes', 'supportsMath']),
		...Utils.mapState('editor', ['initialNode']),
		...Utils.mapGetters('editor', ['getModelNodeFromDnD']),
		isMath() {
			return (this.supportsMath && this.processes.isMath(this.value));
		}
	},
	data() {
		return {
			showHelpOverlay: this.showIntro,
			canUndo: false,
			canRedo: false,
			canPaste: false,
			compactMode: false,
			hasSelection: false,
			formula: null,
			isFullScreen: false
		};
	},
	watch: {
		value: {
			immediate: true,
			handler(value) {
				if (value) {
					this.showHelpOverlay = false;
				}
				if (this.initialNode && Utils.isObject(value) && Utils.isObject(value.process_graph)) {
					try {
						let node = this.initialNode;
						if (node == "1" && Utils.size(value.process_graph)) {
							node = Object.keys(value.process_graph)[0];
						}
						this.openArgumentEditorForNode(node);
					} catch (error) {
						Utils.exception(this, error);
					} finally {
						this.setInitialNode(null);
					}
				}
			}
		}
	},
	mounted() {
		this.canPaste = navigator && navigator.clipboard && typeof navigator.clipboard.readText === 'function';
	},
	methods: {
		...Utils.mapMutations('editor', ['setInitialNode', 'setModelDnD']),
		commit(value) {
			// Fix #115: Return the default value/null if no nodes are given
			if (typeof this.defaultValue !== 'undefined' && Utils.isObject(value) && Utils.size(value.process_graph) === 0) {
				value = this.defaultValue;
			}
			this.$emit('input', value);
		},
		async paste() {
			if (!this.canPaste) {
                Utils.error(this, 'error', 'Pasting is not supported by your browser.');
			}
			try {
				const text = await navigator.clipboard.readText();
				let process = JSON.parse(text);
				await this.$refs.blocks.import(process);
			} catch(error) {
				Utils.exception(this, error, 'Paste Error');
			}
		},
		importProcess() {
			this.broadcast('importProcess');
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
			this.showHelpOverlay = false;
			event.preventDefault();
		},
		async onDrop(event) {
			const node = await this.getModelNodeFromDnD();
			if (node) {
				this.insertProcess(node, event.pageX, event.pageY);
				this.setModelDnD();
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
					reader.onerror = error => Utils.exception(this, error, "Reading JSON file failed");
					reader.readAsText(file, "UTF-8");
					return event.preventDefault();
				}
			}
		},
		getNameField(value = undefined, name = "name") {
			return {
				value,
				name,
				description: 'A unique identifier. Must contain only letters (`a`-`z`), digits (`0`-`9`) and underscores (`_`). `snake_case` is recommended.',
				label: 'Name',
				schema: {
					type: 'string',
					pattern: '^\\w+$'
				},
				default: null
			};
		},
		getDescriptionField(value = undefined, optional = false, name = "description", label = "Description") {
			return {
				value,
				name,
				description: 'Provides a detailed description. CommonMark (Markdown) syntax can be used for rich text formatting.',
				label,
				optional,
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
				description: 'Parameters by default are required. CHeck this option to make the parameter optional. For optional parameters a default value should be specified.',
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
				description: 'This value is used whenever the user of this process did not specify a value for this parameter.',
				toggledBy: 'optional',
				optional: true,
				schema: {}
			};
		},
		getExperimentalField(value = undefined) {
			return {
				value,
				name: 'experimental',
				label: 'Experimental',
				description: 'Declares that this is experimental, which means that it is unstable and likely to change.',
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
				description: 'Declares that this is deprecated with the potential to be removed in any of the next versions. It should be transitioned out of usage.',
				optional: true,
				schema: {
					type: 'boolean'
				},
				default: false
			};
		},
		getSchemaField(value = undefined, name = "schema", label = "Data Types") {
			let subtype = !value ? 'openeo-datatype' : 'json-schema';
			return {
				value,
				name,
				label,
				description: 'Allowed data type(s) as JSON Schema.',
				schema: [
					{
						title: 'Single data type',
						type: 'object',
						subtype
					},
					{
						title: 'Multiple data types',
						type: 'array',
						minItems: 2,
						items: {
							type: 'object',
							subtype
						}
					}
				]
			};
		},
		editProcess(process) {
			process = Utils.isObject(process) ? process : {};
			let returns = Utils.isObject(process.returns) ? process.returns : {};
			var fields = [
				this.getNameField(process.id, 'id'),
				{
					value: process.summary,
					name: 'summary',
					description: 'A very short description of the process with usually less than 60 characters.',
					label: 'Summary',
					optional: true,
					schema: {
						type: 'string'
					}
				},
				this.getDescriptionField(process.description, true),
				{
					value: process.categories,
					name: 'categories',
					label: 'Categories',
					optional: true,
					schema: {
						type: 'array',
						items: {
							type: 'string'
						}
					}
				},
				this.getExperimentalField(process.experimental),
				this.getDeprecatedField(process.deprecated),
				{
					label: 'Parameters',
					description: 'The parameters can be edited directly in the "Visual Model" interface.',
					info: true
				},
				this.getDescriptionField(returns.description, true, 'returns_description', 'Return Value > Description'),
				this.getSchemaField(returns.schema, 'returns_schema', 'Return Value > Data Type'),
				{
					value: process.exceptions,
					name: 'exceptions',
					description: 'Declares exceptions (errors) that might occur during execution of this process. This list is just for informative purposes.\n\nThe keys of the object are the error codes, which should only consist of alphanumerical characters. `PascalCase` is recommended.',
					label: 'Errors',
					optional: true,
					schema: {
						type: 'object',
						additionalProperties: {
							type: 'object',
							required: [
								"message"
							],
							properties: {
								message: {
									title: 'Error Message',
									type: 'string'
								},
								description: {
									title: 'Description',
									type: 'string',
									subtype: 'commonmark'
								},
								http: {
									title: 'HTTP Status Code',
									type: 'integer',
									enum: [
										400,
										500,
										501
									]
								}
							},
						}
					}
				},
				{
					value: process.examples,
					name: 'examples',
					label: 'Examples',
					description: 'Example calls for this process with specific values for the parameters (arguments) and the result (return value).',
					optional: true,
					schema: {
						type: 'array',
						items: {
							type: 'object',
							required: [
								"arguments"
							],
							properties: {
								title: {
									title: 'Title',
									type: 'string'
								},
								title: {
									title: 'Description',
									type: 'string',
									subtype: 'commonmark'
								},
								arguments: {
									title: 'Arguments',
									type: 'object',
									default: {}
								},
								returns: {
									title: 'Return Value'
								}
							}
						}
					}
				},
				{
					value: process.links,
					name: 'links',
					label: 'Links',
					description: 'Links related to this process, e.g. additional documentation.',
					optional: true,
					schema: {
						type: 'array',
						items: {
							type: 'object',
							required: [
								"href",
								"rel"
							],
							properties: {
								href: {
									title: 'URL',
									type: 'string'
								},
								rel: {
									title: 'Relation',
									description: 'For examples see [IANA relation types](https://www.iana.org/assignments/link-relations/link-relations.xhtml)',
									type: 'string',
									default: 'about'
								},
								title: {
									title: 'Title',
									type: 'string'
								},
								type: {
									title: 'Media Type',
									description: 'For examples see [IANA media types](https://www.iana.org/assignments/media-types/media-types.xhtml)',
									type: 'string'
								}
							}
						}
					}
				}
			];
			this.broadcast('showDataForm', "Edit Process", fields, async data => {
				let newData = Utils.pickFromObject(data, ['id', 'summary', 'description', 'categories', 'experimental', 'deprecated', 'exception', 'examples', 'links']);
				if (typeof newData.description === 'string' || Utils.isObject(newData.schema)) {
					newData.returns = {
						description: data.returns_description,
						schema: data.returns_schema
					};
				}
				
				let process = this.$refs.blocks.export(true);
				let newProcess = Object.assign({}, process, newData);
				const defaults = {
					id: "",
					summary: "",
					description: "",
					categories: [],
					experimental: false,
					deprecated: false,
					examples: [],
					links: [],
					process_graph: {},
				};
				// Clean up some defaults / empty values
				for(let key in defaults) {
					if (Utils.equals(defaults[key], newProcess[key])) {
						delete newProcess[key];
					}
				}
				this.commit(newProcess);
			});
		},
		addParameter() {
			var fields = [
				this.getNameField(),
				this.getDescriptionField(),
				this.getOptionalField(),
				this.getDefaultField(),
				this.getExperimentalField(),
				this.getDeprecatedField(),
				this.getSchemaField()
			];
			this.broadcast('showDataForm', "Add Parameter", fields, async data => {
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
				this.getDefaultField(parameter.default),
				this.getExperimentalField(parameter.experimental),
				this.getDeprecatedField(parameter.deprecated),
				this.getSchemaField(parameter.schema)
			];
			this.broadcast('showDataForm', title, fields, saveCallback);
		},
		showExpressionModal() {
			let js = new JavaScript(this.value, this.processes, this.connection, true);
			js.setCallbackParameters(this.$refs.blocks.getPgParameters().map(block => block.spec));
			try {
				js.parse();
				let props = {
					process: js
				};
				let events = {
					save: this.insertNodes
				};
				this.broadcast('showModal', 'ExpressionModal', props, events);
			} catch (error) {
				Utils.exception(this, error);
			}
		},
		openArgumentEditorForNode(nodeId) {
			let process = Utils.deepClone(this.value);
			let node = process.process_graph[nodeId];
			let processSpec = this.processes.get(node.process_id, node.namespace);
			if (Array.isArray(processSpec.parameters) && processSpec.parameters.length > 0) {
				this.openArgumentEditor(
					processSpec.parameters.map(p => new ProcessParameter(p)).filter(p => p.isEditable()),
					node.arguments,
					processSpec.id,
					true,
					null,
					data => {
						Object.assign(node, {arguments: data});
						this.commit(process);
					}
				);
			}
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
			this.broadcast('showModal', 'ParameterModal', props, events);
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
				let namespace = node.namespace;
				if (namespace === 'backend' || namespace === 'user') {
					namespace = null;
				}
				this.$refs.blocks.addProcess(node.process_id, node.arguments, pos, namespace);
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

<style lang="scss">
.visualEditor {
	background-color: white;
	height: 100%;
	display: flex;
	flex-direction: column;

	.vue-component.model-builder {
		min-height: 100px;
		min-width: 100px;
	}

	.model-overlay {
		position: absolute;
		width: 100%;
		height: 100%;
		left: 0;
		top: 0;
		color: #555;
		z-index: 5;
		padding: 1em;
		overflow: auto;
		box-sizing: border-box;
		line-height: 1.25em;

		> h2 {
			font-size: 1.2em;
			text-align: center;
			border-bottom: 0;
			margin-bottom: 0.5em;
			padding: 0;
		}
		> p {
			margin: 0.5em 0;

			> ul {
				margin: 0.25em 0;
			}
			&:first-of-type {
				margin-top: 0;
			}
			&:last-of-type {
				margin-bottom: 0;
			}
		}
	}

	.discoveryToolbar {
		width: 25%;
		min-width: 150px;
		border-left: 1px solid #ddd;
	}
	.editorSplitter {
		display: flex;
		flex-direction: row-reverse;
		flex-grow: 1;
		height: 100%;
		overflow: hidden;
	}

	&.fullscreen {
		display: flex;
		flex-direction: column;

		.discoveryToolbar {
			width: 15%;
			min-width: 250px;
		}
		.editorSplitter {
			height: 100%;
		}
	}
}

.graphBuilder {
	height: 100%;
	flex-grow: 1;
	position: relative;
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
