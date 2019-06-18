<template>
	<Modal ref="modal" minWidth="80%">
		<template v-slot:main>
			<section class="vue-component basedata">
				<div class="tabular"><label>ID:</label> <code class="value">{{ pg.id }}</code></div>
			</section>

			<section class="vue-component description" v-if="pg.description">
				<h3>Description</h3>
				<Description :description="pg.description"></Description>
			</section>

			<section class="process-graph">
				<div class="vue-component"><h3>Process Graph</h3></div>
				<Editor :processGraph="pg.processGraph" :editable="false" :enableExecute="false" id="pgInfoViewer" />
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
	name: 'ProcessGraphInfoModal',
	components: {
		Description,
		Editor,
		Modal
	},
	computed: {
		displayTitle() {
			return "Process Graph: " + (this.pg.title || "#" + this.pg.id);
		}
	},
	data() {
		return {
			pg: {}
		};
	},
	methods: {
		show(pg) {
			this.pg = pg;
			this.$refs.modal.show(this.displayTitle);
		}
	}
}
</script>