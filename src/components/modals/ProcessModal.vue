<template>
	<Modal :width="minWidth" :title="process.id" @closed="$emit('closed')">
		<div class="docgen">
			<!-- ToDo: Implement processUrl -->
			<!-- ToDo: Show info (badge?) that process is custom -->
			<Process :process="process" :provideDownload="false" :showGraph="true" :federation="federation">
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
import Utils from '../../utils';

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
		...Utils.mapGetters(['federation']),
		minWidth() {
			if (Utils.isObject(this.process) && this.process.process_graph) {
				return "80%";
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