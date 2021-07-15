<template>
	<Modal :minWidth="minWidth" :title="process.id" @closed="$emit('closed')">
		<div class="docgen">
			<!-- ToDo: Implement processUrl -->
			<!-- ToDo: Show info (badge?) that process is custom -->
			<Process :process="process" :provideDownload="false" :showGraph="true">
				<template #process-graph>
					<Editor :value="process" :editable="false" class="infoViewer" id="pgInfoViewer" />
				</template>
			</Process>
		</div>
	</Modal>
</template>

<script>
import Editor from '../Editor.vue';
import Modal from './Modal.vue';
import Process from '@openeo/vue-components/components/Process.vue';

export default {
	name: 'ProcessModal',
	components: {
		Editor,
		Modal,
		Process
	},
	props: {
		process: {
			type: Object
		}
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
	}
}
</script>

<style lang="scss">
.docgen .process > h2 {
	display: none;
}
</style>