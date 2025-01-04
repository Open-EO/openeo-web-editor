<template>
	<Modal width="80%" title="Export as Source Code" @closed="$emit('closed')">
		<section class="exportCode">
			<h3>Choose Programming Language</h3>
			<input type="radio" v-model="language" id="js" value="JavaScript" /><label for="js">JavaScript</label>
			<input type="radio" v-model="language" id="py" value="Python" /><label for="py">Python</label>
			<input type="radio" v-model="language" id="r" value="R" /><label for="r">R</label>
			<h3>Generated Code</h3>
			<div v-if="error" class="message error">
				<i class="fas fa-exclamation-circle"></i>
				<span>
					Sorry, the code generation failed due to the following reason:<br />
					<em>{{ error }}</em>
				</span>
			</div>
			<template v-else>
				<div class="message warning">
					<i class="fas fa-bullhorn"></i>
					<span>Please note that this feature is <strong>experimental</strong> and there are chances that the generated code won't work. Also, the code generated is not always following best practices nor will the implementation use the most efficient way of implementing processes, which is the nature of automatic code generation.</span>
				</div>
				<TextEditor :id="language" :title="language" :value="code" :language="language" :editable="false" ref="editor">
					<template #file-toolbar>
						<button type="button" @click="download" title="Download code"><i class="fas fa-download"></i></button>
					</template>
				</TextEditor>
			</template>
		</section>
	</Modal>
</template>

<script>
import { OpenEO } from '@openeo/js-client';
import TextEditor from '../TextEditor.vue';
import Modal from './Modal.vue';
import Utils from '../../utils';
import JavaScript from '../../export/javascript';
import Python from '../../export/python';
import R from '../../export/r';

export default {
	name: 'ExportCodeModal',
	components: {
		Modal,
		TextEditor
	},
	data() {
		return {
			language: 'JavaScript',
			code: '',
			error: null
		};
	},
	computed: {
		...Utils.mapState(['connection']),
		...Utils.mapState('editor', ['process']),
		...Utils.mapGetters(['processes', 'supportsMath']),
	},
	watch: {
		language: {
			immediate: true,
			async handler() {
				try {
					let exporter;
					if (this.language === 'JavaScript') {
						exporter = new JavaScript(this.process, this.processes, this.connection, this.supportsMath);
					}
					else if (this.language === 'Python') {
						exporter = new Python(this.process, this.processes, this.connection);
					}
					else if (this.language === 'R') {
						exporter = new R(this.process, this.processes, this.connection);
					}
					else {
						throw new Error('Unsupported programming language selected');
					}
					this.code = exporter ? await exporter.toCode() : '';
					this.error = null;
				} catch (error) {
					this.code = '';
					this.error = error instanceof Error ? error.message : error;
				}
			}
		}
	},
	methods: {
		download() {
			let filename;
			if (this.language === 'JavaScript') {
				filename = 'code.js';
			}
			else if (this.language === 'Python') {
				filename = 'code.py';
			}
			else if (this.language === 'R') {
				filename = 'code.r';
			}
			Utils.saveToFile(this.code, filename);
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
		height: 50vh;
	}
}
</style>