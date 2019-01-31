<template>
	<div id="SourceEnvironment">
		<div id="sourceCodeEditor"></div>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';

import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript.js';
import CodeMirror from 'codemirror';

export default {
	name: 'SourceEnvironment',
	props: ['active'],
	data() {
		return {
			editorOptions: {
				mode: 'javascript',
				indentUnit: 2,
				lineNumbers: true
			},
			editor: null
		}
	},
	watch: {
		active() {
			this.editor.refresh();
		}
	},
	mounted() {
		this.editor = CodeMirror(document.getElementById('sourceCodeEditor'), this.editorOptions);
		this.editor.setSize(null, "100%");

		EventBus.$on('insertProcessGraph', this.insertProcessGraph);
		EventBus.$on('addProcessToEditor', this.insertToEditor);
		EventBus.$on('addCollectionToEditor', this.insertToEditor);
	},
	methods: {
		getProcessGraph(callback, silent = false) {
			var script = this.editor.getSelection();
			if (!script) {
				script = this.editor.getValue();
			}
			var pg = null;
			if (script) {
				try {
					pg = JSON.parse(script);
				} catch(error) {
					console.log(error);
					this.$utils.error(this, 'The source code must be valid JSON.');
					return;
				}
			}

			if (pg !== null) {
				callback(pg);
			}
			else if (!silent) {
				this.$utils.error(this, 'No valid model or source code specified.');
			}
		},

		insertToEditor(text, replace = false) {
			if (!this.active) {
				return;
			}
			if (replace) {
				this.editor.setValue(text);
				this.scriptName = '';
			}
			else {
				this.editor.replaceSelection(text);
			}
		},

		insertProcessGraph(pg) {
			if (!this.active) {
				return;
			}

			this.insertToEditor(JSON.stringify(pg, null, 2), true);
		}

	}
}
</script>

<style scoped>
.sourceToolbar {
	text-align: right;
}
.sourceHeader {
	padding: 5px;
	border-bottom: dotted 1px #676767;
	display: flex;
}
#sourceCodeEditor {
	height: 400px;
}
</style>
