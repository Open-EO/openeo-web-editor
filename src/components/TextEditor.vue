<template>
	<div class="textEditor" :class="languageString">
		<div class="sourceHeader">
			<strong v-if="title">{{ title }}</strong>
			<div class="sourceToolbar" ref="sourceToolbar">
				<select v-if="languageChooser" class="language-chooser" :value="editorLanguage"
					@change="changeLanguage($event.target.value)" title="Select language">
					<option value="">Plain Text</option>
					<option value="javascript">JavaScript</option>
					<option value="json">JSON</option>
					<option value="markdown">Markdown</option>
					<option value="math">Math</option>
					<option value="python">Python</option>
					<option value="r">R</option>
					<option value="yaml">YAML</option>
				</select>
				<span class="group" v-if="editable">
					<BButton @click="confirmClear" title="Start from scratch - Clears the current script">
						<i class="fas fa-file"></i> <span class="text">New</span>
					</BButton>
					<AsyncButton :fn="upload" fa icon="fas fa-cloud-upload-alt" title="Upload a file from your computer - Clears the current script"><span class="text">Upload</span></AsyncButton>
					<slot name="file-toolbar"></slot>
				</span>
				<span class="group" v-if="editable">
					<BButton @click="editor.undo()" :disabled="!canUndo" title="Revert the last change">
						<i class="fas fa-undo-alt"></i> <span class="text">Undo</span>
					</BButton>
					<BButton @click="editor.redo()" :disabled="!canRedo" title="Redo the last reverted change">
						<i class="fas fa-redo-alt"></i> <span class="text">Redo</span>
					</BButton>
					<slot name="edit-toolbar"></slot>
				</span>
				<FullscreenButton :element="element" />
				<slot name="toolbar"></slot>
			</div>
		</div>
		<div :id="id" class="sourceCodeEditor"></div>
	</div>
</template>

<script>
import Utils from '../utils.js';
import FullscreenButton from './FullscreenButton.vue';
import ToolbarCompactMixin from './ToolbarCompactMixin.js';
import AsyncButton from '@openeo/vue-components/components/internal/AsyncButton.vue';
import BButton from '@openeo/vue-components/components/internal/BButton.vue';
import { ProcessGraph } from '@openeo/js-processgraphs';

import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';

import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/markdown/markdown.js';
import 'codemirror/mode/mathematica/mathematica.js';
import 'codemirror/mode/python/python.js';
import 'codemirror/mode/r/r.js';
import 'codemirror/mode/yaml/yaml.js';

import 'codemirror/addon/display/placeholder.js';

import 'codemirror/addon/edit/matchbrackets.js';
import 'codemirror/addon/edit/closebrackets.js';

import 'codemirror/addon/lint/lint.css';
import 'codemirror/addon/lint/lint.js';
import 'codemirror/addon/lint/json-lint.js'
import jsonlint from 'jsonlint-mod';
window.jsonlint = jsonlint;

export default {
	name: 'TextEditor',
	mixins: [ToolbarCompactMixin],
	components: {
		AsyncButton,
		BButton,
		FullscreenButton
	},
	props: {
		id: String,
		editable: {
			type: Boolean,
			default: true
		},
		value: {
			required: true
		},
		language: {
			type: String,
			default: null // json, r, python, markdown, processgraph or null
		},
		placeholder: {
			type: String,
			default: ""
		},
		title: {
			type: String
		},
		languageChooser: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		...Utils.mapGetters(['processes']),
		languageString() {
			return typeof this.activeLanguage === 'string' ? this.activeLanguage.toLowerCase() : '';
		},
		editorLanguage() {
			// Some additional aliases for some languages
			switch (this.languageString) {
				case 'processgraph':
					return 'json';
				case 'cwl':
				case 'eoap-cwl':
					return 'yaml';
				default:
					return this.languageString;
			}
		},
		editorOptions() {
			let options = {
				indentUnit: 2,
				lineNumbers: true,
				indentWithTabs: true,
				matchBrackets: true,
				autoCloseBrackets: true,
				readOnly: !this.editable,
				placeholder: this.placeholder,
				mode: null,
				gutters: [],
				lint: false,
				lineWrapping: false
			};
			switch(this.editorLanguage) {
				case 'r':
					options.mode = 'text/x-rsrc';
					break;
				case 'python':
					options.mode = 'text/x-python';
					break;
				case 'math':
					options.mode = 'text/x-mathematica'; // Use mathematica mode until we have something better for openEO
					break;
				case 'markdown':
					options.mode = 'text/x-markdown';
					options.lineWrapping = true;
					break;
				case 'javascript':
					options.mode = 'text/javascript';
					break;
				case 'json':
					options.mode = 'application/json';
					options.gutters = ['CodeMirror-lint-markers'];
					options.lint = true;
					break;
				case 'yaml':
					options.mode = 'text/x-yaml';
					options.gutters = ['CodeMirror-lint-markers'];
					break;
			}
			return options;
		}
	},
	data() {
		return {
			canUndo: false,
			canRedo: false,
			editor: null,
			emitValue: this.value,
			element: null,
			activeLanguage: this.language
		}
	},
	watch: {
		async value() {
			if (this.emitValue !== this.value) {
				this.updateContent();
				this.editor.clearHistory();
			}
		},
		language(newLang) {
			this.activeLanguage = newLang;
		},
		editorOptions(newOptions) {
			for(var key in newOptions) {
				this.editor.setOption(key, newOptions[key]);
			}
		}
	},
	mounted() {
		this.editor = CodeMirror(document.getElementById(this.id), this.editorOptions);
		this.editor.setSize(null, "100%");
		if (this.languageString === 'processgraph') {
			this.editor.on("change", () => this.updateState());
		}
		this.updateContent();

		// Listen for changes only after first initialization
		this.editor.on('changes', (cm, evt) => {
			try {
				// Don't commit external changes (i.e. coming from the value prop)
				if (!Object.values(evt).find(e => e.origin === 'setValue')) {
					this.commit(false);
				}
			} catch (error) {
				this.$emit('error', error);
			}
		});

		this.element = this.$el;
	},
	methods: {
		async upload() {
			// Create temporary file input element to trigger file selection dialog
			const fileInput = document.createElement('input');
			fileInput.type = 'file';
			fileInput.style.display = 'none';
			document.body.appendChild(fileInput);
			try {
				// Click the file input to open the file dialog
				fileInput.click();
				// Wait for the user to select a file (or cancel)
				const file = await new Promise(resolve => {
					fileInput.addEventListener('change', () => {
						resolve(fileInput.files[0] || null);
					}, { once: true });
					// Handle cancel: when focus returns without a change event
					window.addEventListener('focus', () => {
						setTimeout(() => resolve(null), 300);
					}, { once: true });
				});
				if (!file) {
					return false;
				}
				// Read the file content as text
				const content = await new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = () => resolve(reader.result);
					reader.onerror = () => reject(reader.error);
					reader.readAsText(file);
				});
				if (!this.confirmClear()) {
					return false;
				}
				this.insert(content);
				if (this.languageChooser) {
					const lang = this.detectLanguage(file);
					if (lang !== null) {
						this.activeLanguage = lang;
						this.$emit('update:language', lang);
					}
				}
				this.commit();
				return true;
			} catch (error) {
				Utils.exception(this, error, "Upload failed");
				return false;
			} finally {
				// Clean up the temporary file input element
				document.body.removeChild(fileInput);
			}
		},
		detectLanguage(file) {
			// Try to detect language from MIME type
			if (typeof file.type === 'string' && file.type.includes('/')) {
				switch (file.type.toLowerCase().replace(/;.*$/, '').trim()) {
					case 'application/json':
					case 'application/geo+json':
					case 'text/json':
						return 'json';
					case 'application/javascript':
					case 'text/javascript':
						return 'javascript';
					case 'text/markdown':
						return 'markdown';
					case 'text/x-python':
					case 'application/x-python':
						return 'python';
					case 'application/x-yaml':
					case 'text/yaml':
					case 'text/x-yaml':
						return 'yaml';
					case 'text/plain':
						break; // fall through to extension detection
					default:
						return null;
				}
			}
			// Fallback: detect by file extension
			if (typeof file.name === 'string') {
				const ext = file.name.split('.').pop().trim().toLowerCase();
				switch (ext) {
					case 'json':
					case 'geojson':
						return 'json';
					case 'js':
					case 'mjs':
					case 'cjs':
						return 'javascript';
					case 'md':
					case 'markdown':
						return 'markdown';
					case 'py':
						return 'python';
					case 'r':
						return 'r';
					case 'yml':
					case 'yaml':
					case 'cwl':
						return 'yaml';
				}
			}
			return null;
		},
		changeLanguage(lang) {
			this.activeLanguage = lang;
			this.$emit('update:language', lang);
			this.$nextTick(() => {
				this.editor.refresh();
			});
		},
		confirmClear() {
			if (this.editor.getValue().trim() === "") {
				return true;
			}
			const confirmed = confirm("Do you really want to clear the existing code?");
			if (confirmed) {
				this.insert("");
				this.emit(null);
			}
			return confirmed;
		},
		updateState() {
			// Don't lint empty values
			this.editor.setOption("lint", !!this.editor.getValue().trim());
			// Update history state
			let history = this.editor.getDoc().historySize();
			this.canUndo = history.undo > 0;
			this.canRedo = history.redo > 0;
			// Refresh editor
			this.editor.refresh();
			// Refresh element for fullscreen
			this.element = this.$el;
		},
		commit(updateContext = true) {
			var value = this.editor.getValue();
			switch(this.languageString) {
				case 'math':
					return this.emit(value.replace(/[\r\n\t]+/, ' ')); // Replace line breaks and tabs with simple spaces
				case 'processgraph':
					if (value) {
						var process = JSON.parse(value);
						if (Utils.size(process) > 0) {
							var pg = new ProcessGraph(process, this.processes);
							pg.allowEmpty();
							pg.parse();
							return this.emit(process);
						}
					}
					return this.emit(updateContext ? null : "");
				case 'json':
					if (value) {
						if (typeof value === 'string') {
							value = JSON.parse(value);
						}
						return this.emit(value);
					}
					else {
						return this.emit(null);
					}
				default:
					return this.emit(value);
			}
		},
		emit(value) {
			this.emitValue = value;
			this.$emit('input', value);
		},
		insert(text, replace = true) {
			if (typeof text !== 'string') {
				text = String(text);
			}
			if (replace) {
				// Only update if it has really changed
				const cmValue = this.editor.getValue();
				if (text !== cmValue) {
					const scrollInfo = this.editor.getScrollInfo();
					this.editor.setValue(text);
					this.editor.scrollTo(scrollInfo.left, scrollInfo.top)
				}
			}
			else {
				this.editor.replaceSelection(text);
			}
		},
		updateContent() {
			if (this.value) {
				switch(this.languageString) {
					case 'processgraph':
						if (Utils.isObject(this.value)) {
							this.insert(JSON.stringify(this.value, null, this.editorOptions.indentUnit));
						}
						else {
							this.insert("");
						}
						break;
					case 'json':
						let value = this.value;
						if (typeof this.value !== 'string') {
							value = JSON.stringify(this.value, null, this.editorOptions.indentUnit);
						}
						this.insert(value);
						break;
					default:
						this.insert(this.value);
				}
			}
			else {
				this.insert("");
			}
			this.editor.getDoc().clearHistory();
			this.updateState();
		},

		insertProcess(node) {
			try {
				this.insert(JSON.stringify(node, null, 2), false);
			} catch(error) {
				Utils.exception(this, error);
			}
		},

	}
}
</script>

<style scoped>
.textEditor {
	height: 100%;
	display: flex;
	flex-direction: column;
	border: 1px solid #ddd;
}
.sourceCodeEditor {
	flex-grow: 1;
	height: 100%;
	overflow: hidden;
}
.language-chooser {
	padding: 2px 4px;
	font-size: 0.9em;
	width: auto !important;
}
</style>
<style>
.textEditor.math .cm-operator {
	margin: 0 0.2em;
}
.textEditor.markdown .CodeMirror-wrap pre {
    word-break: break-word;
}
.CodeMirror-placeholder {
	opacity: 0.5;
}
</style>
