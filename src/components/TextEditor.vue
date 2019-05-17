<template>
	<div id="TextEditor">
		<EditorToolbar :onStore="getProcessGraph" :onInsert="insertProcessGraph" :onClear="clearProcessGraph" />
		<div id="sourceCodeEditor"></div>
		<DiscoveryToolbar :onAddCollection="insertToEditor" :onAddProcess="insertToEditor" />
	</div>
</template>

<script>
import EventBus from '../eventbus.js';
import Utils from '../utils.js';
import EditorToolbar from './EditorToolbar.vue';
import DiscoveryToolbar from './DiscoveryToolbar.vue';

import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript.js';
import CodeMirror from 'codemirror';

export default {
	name: 'TextEditor',
	components: {
		EditorToolbar,
		DiscoveryToolbar
	},
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
		active(newVal) {
			if (newVal) {
				this.editor.refresh();
			}
		}
	},
	mounted() {
		this.editor = CodeMirror(document.getElementById('sourceCodeEditor'), this.editorOptions);
		this.editor.setSize(null, "100%");
	},
	methods: {
		clearProcessGraph() {
			this.insertToEditor("", true);
		},
	
		getProcessGraph(callback, silent = false, passNull = false) {
			var script = this.editor.getValue();
			var pg = null;
			if (script) {
				try {
					pg = JSON.parse(script);
				} catch(error) {
					console.log(error);
					Utils.error(this, 'The source code must be valid JSON.');
					return;
				}
			}

			if (pg !== null || passNull) {
				callback(pg);
			}
			else if (!silent) {
				Utils.error(this, 'No valid source code specified.');
			}
		},

		insertToEditor(text, replace = false) {
			if (replace) {
				this.editor.setValue(text);
			}
			else {
				this.editor.replaceSelection(text);
			}
		},

		insertProcessGraph(pg) {
			if (!pg) {
				this.insertToEditor("");
			}
			else {
				this.insertToEditor(JSON.stringify(pg, null, 2), true);
			}
		}

	}
}
</script>

<style scoped>
#sourceCodeEditor {
	height: 400px;
}
</style>
