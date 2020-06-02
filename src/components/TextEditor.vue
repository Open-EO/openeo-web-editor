<template>
	<div class="textEditor">
		<EditorToolbar :editable="editable" :onClear="clear">
			<span class="sepr" v-if="editable">
				<button type="button" @click="editor.undo()" :disabled="!canUndo" title="Revert last change"><i class="fas fa-undo-alt"></i></button>
				<button type="button" @click="editor.redo()" :disabled="!canRedo" title="Redo last reverted change"><i class="fas fa-redo-alt"></i></button>
			</span>
			<button type="button" @click="toggleFullScreen()" :title="isFullScreen ? 'Close fullscreen' : 'Show fullscreen'">
				<span v-show="isFullScreen"><i class="fas fa-compress"></i></span>
				<span v-show="!isFullScreen"><i class="fas fa-expand"></i></span>
			</button>
		</EditorToolbar>
		<div :id="id" class="sourceCodeEditor"></div>
	</div>
</template>

<script>
import Utils from '../utils.js';
import EditorToolbar from './EditorToolbar.vue';
import { ProcessGraph } from '@openeo/js-processgraphs';

import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';

import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/markdown/markdown.js';
import 'codemirror/mode/python/python.js';
import 'codemirror/mode/r/r.js';

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
		EditorToolbar
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
		}
	},
	computed: {
		...Utils.mapGetters(['processRegistry']),
		editorOptions() {
			let options = {
				indentUnit: 2,
				lineNumbers: true,
				indentWithTabs: true,
				matchBrackets: true,
				autoCloseBrackets: true,
				readOnly: !this.editable
			};
			switch(this.language) {
				case 'r':
					options.mode = 'text/x-rsrc';
					break;
				case 'python':
					options.mode = 'text/x-python';
					break;
				case 'markdown':
					options.mode = 'text/x-markdown';
					break;
				case 'json':
				case 'processgraph':
					Object.assign(options, {
						mode: "application/json",
						gutters: ["CodeMirror-lint-markers"],
						lint: true
					});
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
			isFullScreen: false
		}
	},
	watch: {
		value() {
			if (this.emitValue !== this.value) {
				this.updateContent();
				this.editor.refresh();
				this.editor.clearHistory();
			}
		}
	},
	mounted() {
		this.editor = CodeMirror(document.getElementById(this.id), this.editorOptions);
		this.editor.setSize(null, "100%");
		if (this.language === 'processgraph') {
			this.editor.on("change", () => {
				// Don't lint empty values
				this.editor.setOption("lint", !!this.editor.getValue().trim());
				// Update history state
				this.updateHistoryState();
			});
		}
		this.updateContent();

		// Listen for changes only after first initialization
		this.editor.on('changes', (cm, evt) => {
			try {
				// Don't commit external changes (i.e. coming from the value prop)
				if (Object.values(evt).filter(e => e.origin === 'setValue').length === 0) {
					this.commit();
				}
			} catch (error) {
				this.$emit('error', error);
			}
		});
	},
	methods: {
		clear() {
			this.insert("");
		},
		updateHistoryState() {
			let history = this.editor.getDoc().historySize();
			this.canUndo = history.undo > 0;
			this.canRedo = history.redo > 0;
		},
		toggleFullScreen() {
			var element = this.$el;
			if (!this.isFullScreen) {
				this.isFullScreen = true;
				element.classList.add('fullscreen');
			}
			else {
				this.isFullScreen = false;
				element.classList.remove('fullscreen');
			}
		},
		commit() {
			var value = this.editor.getValue();
			switch(this.language) {
				case 'processgraph':
					if (value) {
						var process = JSON.parse(value);
						if (Utils.size(process) > 0) {
							var pg = new ProcessGraph(process, this.processRegistry);
							pg.parse();
							return this.emit(process);
						}
					}
					return this.emit(null);
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
				switch(this.language) {
					case 'processgraph':
						if (Utils.isObject(this.value)) {
							this.insert(JSON.stringify(this.value, null, this.editorOptions.indentUnit));
						}
						else {
							this.clear();
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
				this.clear();
			}
			this.editor.getDoc().clearHistory();
			this.updateHistoryState();
		}

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
.fullscreen {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 9990; /* Snotify has 9999 and is intentionally above the fullscreen */
}
.sourceCodeEditor {
	flex-grow: 1;
	height: 100%;
	overflow: auto;
}
</style>
