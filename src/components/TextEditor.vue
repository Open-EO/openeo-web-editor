<template>
	<div class="textEditor">
		<EditorToolbar :editable="editable" :onClear="clear" :isMainEditor="isMainEditor" />
		<div :id="id" class="sourceCodeEditor"></div>
	</div>
</template>

<script>
import Utils from '../utils.js';
import EditorToolbar from './EditorToolbar.vue';
import { ProcessGraph } from '@openeo/js-processgraphs';

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
			default: () => null
		},
		isMainEditor: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		...Utils.mapGetters(['processRegistry'])
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
				this.insertCustomProcess(this.value);
			}
			else {
				this.editor.refresh();
			}
		},

		clear() {
			this.insertToEditor("", true);
		},
	
		getCustomProcess(success, failure, passNull = false) {
			var script = this.editor.getValue();
			var process = null;
			if (script) {
				try {
					process = JSON.parse(script);
				} catch(error) {
					failure('Process graph is invalid JSON', error);
					return;
				}
			}

			if (Utils.isObject(process)) {
				try {
					var pg = new ProcessGraph(process, this.processRegistry);
					pg.parse();
				} catch(error) {
					failure('Process graph invalid', error);
					return;
				}
			}

			if (process !== null || passNull) {
				success(process);
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

		insertCustomProcess(pg) {
			if (!pg) {
				this.clear();
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
