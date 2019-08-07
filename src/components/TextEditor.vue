<template>
	<div class="textEditor">
		<EditorToolbar :editable="editable" :onStore="getProcessGraph" :onInsert="insertProcessGraph" :onClear="clearProcessGraph" :enableClear="enableClear" :enableExecute="enableExecute" :enableLocalStorage="enableLocalStorage" />
		<div :id="id" class="sourceCodeEditor"></div>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';
import Utils from '../utils.js';
import EditorToolbar from './EditorToolbar.vue';
import { ProcessGraph } from '@openeo/js-commons';

import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript.js';
import CodeMirror from 'codemirror';

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
		active: {
			type: Boolean,
			default: false
		},
		value: {
			type: Object,
			default: null
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
		...Utils.mapGetters('server', ['processRegistry'])
	},
	data() {
		return {
			editorOptions: {
				mode: 'javascript',
				indentUnit: 2,
				lineNumbers: true,
				readOnly: !this.$props.editable
			},
			editor: null
		}
	},
	mounted() {
		if (this.active) {
			this.onShow();
		}
	},
	watch: {
		active(newVal) {
			if (newVal) {
				this.onShow();
			}
		}
	},
	methods: {
		onShow() {
			if (this.editor === null) {
				this.editor = CodeMirror(document.getElementById(this.id), this.editorOptions);
				this.editor.setSize(null, "100%");
				this.insertProcessGraph(this.value);
			}
			else {
				this.editor.refresh();
			}
		},

		clearProcessGraph() {
			this.insertToEditor("", true);
		},
	
		getProcessGraph(success, failure, passNull = false) {
			var script = this.editor.getValue();
			var processGraph = null;
			if (script) {
				try {
					processGraph = JSON.parse(script);
				} catch(error) {
					failure('Process graph is invalid JSON', error);
					return;
				}
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
				failure('No process graph specified.');
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
				this.clearProcessGraph();
			}
			else {
				this.insertToEditor(JSON.stringify(pg, null, 2), true);
			}
		}

	}
}
</script>

<style scoped>
.textEditor {
	height: 100%;
	display: flex;
	flex-direction: column;
}
.sourceCodeEditor {
	flex-grow: 1;
	height: 100%;
	overflow: auto;
}
</style>
