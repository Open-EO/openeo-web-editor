<template>
	<Modal minWidth="40%" title="Estimate for Batch Job" @closed="$emit('closed')">
		<JobEstimate :estimate="estimate" :currency="currency" />

		<section class="vue-component basedata" v-if="job">
			<h3>Batch Job</h3>
			<div class="tabular">
				<label>ID:</label>
				<tt class="value">{{ job.id }}</tt>
			</div>
			<div class="tabular" v-if="job.title">
				<label>Title:</label>
				<span class="value">{{ job.title }}</span>
			</div>
		</section>
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
	props: {
		job: {
			type: Object
		},
		estimate: {
			type: Object
		}
	}
}
</script>

<style lang="scss">
.vue-component.estimate h2 {
	display: none;
}
</style>