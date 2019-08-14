<template>
	<Modal ref="modal">
		<template #main>
			<div class="docgen">
				<!-- ToDo: Implement processReferenceBuilder -->
				<Process :processData="process" :version="version" :provideDownload="false"></Process>
			</div>
		</template>
	</Modal>
</template>

<script>
import Modal from './Modal.vue';
import Process from '@openeo/vue-components/components/Process.vue';

export default {
	name: 'ProcessModal',
	components: {
		Modal,
		Process
	},
	data() {
		return {
			version: null,
			process: null
		};
	},
	methods: {
		show(process, version) {
			this.version = version;
			this.process = process;
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