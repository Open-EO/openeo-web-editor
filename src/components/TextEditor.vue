<template>
	<div class="textEditor" :class="languageString">
		<div class="sourceHeader">
			<strong v-if="title">{{ title }}</strong>
			<div class="sourceToolbar">
				<span class="sepr">
					<BButton v-if="editable" @click="confirmClear" title="Start from scratch - Clears the current script"><i class="fas fa-file"></i></BButton>
					<slot name="file-toolbar"></slot>
				</span>
				<span class="sepr" v-if="editable">
					<BButton @click="editor.undo()" :disabled="!canUndo" title="Revert the last change"><i class="fas fa-undo-alt"></i></BButton>
					<BButton @click="editor.redo()" :disabled="!canRedo" title="Redo the last reverted change"><i class="fas fa-redo-alt"></i></BButton>
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
import BButton from '@openeo/vue-components/components/internal/BButton.vue';
import { ProcessGraph } from '@openeo/js-processgraphs';

import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';

import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/markdown/markdown.js';
import 'codemirror/mode/mathematica/mathematica.js';
import 'codemirror/mode/python/python.js';
import 'codemirror/mode/r/r.js';

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
	components: {
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
		}
	},
	computed: {
		...Utils.mapGetters(['processes']),
		languageString() {
			return typeof this.language === 'string' ? this.language.toLowerCase() : '';
		},
		editorOptions() {
			let options = {
				indentUnit: 2,
				lineNumbers: true,
				indentWithTabs: true,
				matchBrackets: true,
				autoCloseBrackets: true,
				readOnly: !this.editable,
				placeholder: this.placeholder
			};
			switch(this.languageString) {
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
				case 'processgraph':
					options.mode = 'application/json';
					options.gutters = ['CodeMirror-lint-markers'];
					options.lint = true;
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
			element: null
		}
	},
	watch: {
		async value() {
			if (this.emitValue !== this.value) {
				this.updateContent();
				this.editor.clearHistory();
			}
		},
		editorOptions() {
			for(var key in this.editorOptions) {
				this.editor.setOption(key, this.editorOptions[key]);
			}
			this.updateContent();
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
		confirmClear() {
			var confirmed = confirm("Do you really want to clear the existing code?");
			if (confirmed) {
				this.insert("");
				this.emit(null);
			}
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
						return this.emit(JSON.parse(value));
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
						this.insert(JSON.stringify(this.value, null, this.editorOptions.indentUnit));
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
