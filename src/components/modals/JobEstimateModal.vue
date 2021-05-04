<template>
	<Modal ref="modal" minWidth="40%">
		<template #main>
			<JobEstimate :estimate="estimate" :currency="currency" />

			<section class="vue-component basedata" v-if="job">
				<h3>Batch Job</h3>
				<div class="tabular">
					<label>ID:</label>
					<code class="value">{{ job.id }}</code>
				</div>
				<div class="tabular" v-if="job.title">
					<label>Title:</label>
					<span class="value">{{ job.title }}</span>
				</div>
			</section>
		</template>
	</Modal>
</template>

<script>
import Utils from '../../utils';
import Modal from './Modal.vue';
import JobEstimate from '@openeo/vue-components/components/JobEstimate.vue';

export default {
	name: 'JobEstimateModal',
	components: {
		JobEstimate,
		Modal
	},
	computed: {
		...Utils.mapGetters(['currency'])
	},
	data() {
		return {
			job: {},
			estimate: {}
		};
	},
	methods: {
		show(job, estimate) {
			this.job = job;
			this.estimate = estimate;
			this.$refs.modal.show("Estimate for Batch Job");
		}
	}
}
</script>

<style>
.vue-component h2 {
	display: none;
}
</style>