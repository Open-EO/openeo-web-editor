<template>
	<Modal ref="modal" minWidth="40%">
		<template #main>
			<section class="vue-component estimate">
				<div class="tabular">
					<label>Costs:</label>
					<span class="value">{{ costs }}</span>
				</div>
				<div class="tabular">
					<label>Runtime:</label>
					<span class="value">{{ duration }}</span>
				</div>
				<div class="tabular">
					<label>File size:</label>
					<span class="value">{{ size }}</span>
				</div>
				<div class="tabular">
					<label>Downloads included:</label>
					<span class="value">{{ downloadsIncluded }}</span>
				</div>
				<div class="tabular" v-if="expires">
					<label>Valid until:</label>
					<span class="value">{{ expires }}</span>
				</div>
			</section>
			<section class="vue-component basedata">
				<h3>Batch Job</h3>
				<div class="tabular"><label>ID:</label> <code class="value">{{ job.id }}</code></div>
				<div class="tabular" v-if="job.title"><label>Title:</label> <span class="value">{{ job.title }}</span></div>
			</section>
		</template>
	</Modal>
</template>

<script>
import Utils from '../../utils';
import Modal from './Modal.vue';
import { isoDuration, en } from '@musement/iso-duration'

export default {
	name: 'JobEstimateModal',
	components: {
		Modal
	},
	computed: {
		...Utils.mapGetters(['currency']),
		downloadsIncluded() {
			if (this.estimate.downloads_included === 0) {
				return "None";
			}
			else if (this.estimate.downloads_included > 0) {
				return `Yes, ${this.estimate.downloads_included}×`;
			}
			else {
				return "Yes, unlimited";
			}
		},
		expires() {
			if (typeof this.estimate.expires === 'string') {
				return Utils.formatDateTime(this.estimate.expires);
			}
			else {
				return null;
			}
		},
		costs() {
			if (typeof this.estimate.costs === 'number') {
				return Utils.formatCurrency(this.estimate.costs, this.currency);
			}
			else {
				return 'n/a';
			}
		},
		size() {
			if (typeof this.estimate.size === 'number') {
				return Utils.formatFileSize(this.estimate.size);
			}
			else {
				return 'n/a'
			}
		},
		duration() {
			if (typeof this.estimate.duration === 'string') {
				isoDuration.setLocales({en});
				const duration = isoDuration(this.estimate.duration);
				return duration.humanize('en');
			}
			else {
				return 'n/a';
			}
		}
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