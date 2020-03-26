<template>
	<Modal ref="modal" minWidth="80%">
		<template #main>
			<section class="vue-component basedata">
				<div class="tabular"><label>ID:</label> <code class="value">{{ pg.id }}</code></div>
			</section>

			<section class="vue-component description" v-if="pg.description">
				<h3>Description</h3>
				<Description :description="pg.description"></Description>
			</section>

			<section class="process-graph">
				<div class="vue-component"><h3>Process</h3></div>
				<Editor :process="pg.process" :editable="false" :enableExecute="false" class="infoViewer" id="pgInfoViewer" />
			</section>

		</template>
	</Modal>
</template>

<script>
import Utils from '../utils';
import Modal from './Modal.vue';
import Description from '@openeo/vue-components/components/Description.vue';
import Editor from './Editor.vue';

export default {
	name: 'CustomProcessInfoModal',
	components: {
		Description,
		Editor,
		Modal
	},
	computed: {
		displayTitle() {
			return "Custom Process: " + this.process.id;
		}
	},
	data() {
		return {
			process: {}
		};
	},
	methods: {
		show(process) {
			this.process = process;
			this.$refs.modal.show(this.displayTitle);
		}
	}
}
</script>