<template>
	<Modal ref="modal" :minWidth="minWidth">
		<template #main>
			<div class="docgen">
				<!-- ToDo: Implement processReferenceBuilder -->
				<Process :processData="process" :version="version" :provideDownload="false"></Process>
				<!-- ToDo: Remove process graph view once implemented in Vue components -->
				<!-- ToDo: Show info (badge?) that process is custom -->
				<section class="process-graph" v-if="process.process_graph">
					<div class="vue-component"><h3>Model</h3></div>
					<Editor :process="process" :editable="false" :enableExecute="false" class="infoViewer" id="pgInfoViewer" />
				</section>
			</div>
		</template>
	</Modal>
</template>

<script>
import Editor from './Editor.vue';
import Modal from './Modal.vue';
import Process from '@openeo/vue-components/components/Process.vue';
import { UserProcess } from '@openeo/js-client';
import { ProcessGraph } from '@openeo/js-processgraphs';

export default {
	name: 'ProcessModal',
	components: {
		Editor,
		Modal,
		Process
	},
	data() {
		return {
			version: null,
			process: null
		};
	},
	computed: {
		minWidth() {
			if (this.process !== null && this.process.process_graph) {
				return "85%";
			}
			else {
				return "50%";
			}
		}
	},
	methods: {
		show(process, version) {
			this.version = version;
			if (process instanceof ProcessGraph || process instanceof UserProcess) {
				this.process = process.toJSON();
			}
			else {
				this.process = process;
			}
			this.$refs.modal.show(process.id);
		}
	}
}
</script>

<style>
.docgen h2 {
	display: none;
}
</style>