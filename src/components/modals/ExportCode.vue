<template>
	<Modal minWidth="80%" title="Export as Source Code" @closed="$emit('closed')">
		<section class="exportCode">
			<h3>Choose Programming Language</h3>
			<input type="radio" v-model="language" id="js" value="JavaScript" selected /><label for="js">JavaScript</label>
			<input type="radio" v-model="language" id="py" value="Python" selected /><label for="py">Python</label>
			<input type="radio" v-model="language" id="r" value="R" selected /><label for="r">R</label>
			<h3>Generated Code</h3>
			<TextEditor :id="language" :title="language" :value="code" :language="language" ref="editor" />
		</section>
	</Modal>
</template>

<script>
import TextEditor from '../TextEditor.vue';
import Modal from './Modal.vue';
import Utils from '../../utils';
import JavaScript from '../../export/javascript';
//import R from '../../export/r';
//import Python from '../../export/python';

export default {
	name: 'ExportCode',
	components: {
		Modal,
		TextEditor
	},
	data() {
		return {
			language: 'JavaScript',
			code: ''
		};
	},
	computed: {
		...Utils.mapState(['connection']),
		...Utils.mapState('editor', ['process']),
		...Utils.mapGetters(['processes']),
	},
	watch: {
		language: {
			immediate: true,
			async handler() {
				let exporter;
				if (this.language === 'JavaScript') {
					exporter = new JavaScript(this.process, this.processes, this.connection);
				}
/*				else if (this.language === 'Python') {
					exporter = new Python(this.process, this.processes, this.connection);
				}
				else if (this.language === 'R') {
					exporter = new R(this.process, this.processes, this.connection);
				} */
				else {
					Utils.error(this, 'Unsupported programming language selected');
				}
				this.code = exporter ? await exporter.toCode() : '';
			}
		}
	}
}
</script>

<style lang="scss">
.exportCode {
	label {
		margin-right: 1em;
	}
	h3:first-of-type {
		margin-top: 0;
	}
	h3:last-of-type {
		margin-top: 2em;
	}
	.textEditor {
		min-height: 200px;
	}
}
</style>