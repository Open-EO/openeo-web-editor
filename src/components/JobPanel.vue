<template>
	<DataTable ref="table" :data="data" :columns="columns" id="JobPanel">
		<template slot="toolbar">
			<button title="Add new job" @click="createJobFromScript()" v-show="supportsCreate"><i class="fas fa-plus"></i> Add</button>
		</template>
		<template slot="actions" slot-scope="p">
			<button title="Details" @click="showJobInfo(p.row)" v-show="supportsRead"><i class="fas fa-info"></i></button>
			<button title="Show in Editor" @click="showInEditor(p.row)" v-show="supportsRead"><i class="fas fa-code-branch"></i></button>
			<button title="Estimate" @click="estimateJob(p.row)" v-show="supports('estimateJob')"><i class="fas fa-file-invoice-dollar"></i></button>
			<button title="Edit metadata" @click="editMetadata(p.row)" v-show="supportsUpdate && isJobInactive(p.row)"><i class="fas fa-edit"></i></button>
			<button title="Replace process" @click="replaceProcess(p.row)" v-show="supportsUpdate && isJobInactive(p.row)"><i class="fas fa-retweet"></i></button>
			<button title="Delete" @click="deleteJob(p.row)" v-show="supportsDelete"><i class="fas fa-trash"></i></button>
			<button title="Start processing" @click="queueJob(p.row)" v-show="supports('startJob') && isJobInactive(p.row)"><i class="fas fa-play-circle"></i></button>
			<button title="Cancel processing" @click="cancelJob(p.row)" v-show="supports('stopJob') && isJobActive(p.row)"><i class="fas fa-stop-circle"></i></button>
			<button title="Download" @click="downloadResults(p.row)" v-show="supports('downloadResults') && hasResults(p.row)"><i class="fas fa-download"></i></button>
			<button title="View results" @click="viewResults(p.row, true)" v-show="supports('downloadResults') && hasResults(p.row)"><i class="fas fa-eye"></i></button>
		</template>
	</DataTable>
</template>

<script>
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import WorkPanelMixin from './WorkPanelMixin';
import Utils from '../utils.js';
import Field from './blocks/field';

export default {
	name: 'JobPanel',
	mixins: [WorkPanelMixin('jobs', 'batch job', 'batch jobs'), EventBusMixin],
	data() {
		return {
			columns: {
				id: {
					name: 'ID',
					primaryKey: true,
					hide: true
				},
				title: {
					name: 'Title',
					computedValue: (row, value) => {
						if (!value && row.id) {
							return "Job #" + row.id.toUpperCase().substr(-6);
						}
						return value;
					},
					edit: this.updateTitle
				},
				status: {
					name: 'Status',
					stylable: true
				},
				submitted: {
					name: 'Submitted',
					format: 'DateTime'
				},
				updated: {
					name: 'Last update',
					format: 'DateTime'
				},
				actions: {
					name: 'Actions',
					filterable: false
				}
			},
			watchers: {},
			jobUpdater: null
		};
	},
	computed: {
		...Utils.mapGetters(['supportsBilling', 'supportsBillingPlans'])
	},
	watchers: {
		jobs(updated, old) {
			// Update Watchers
			let all = updated.concat(old);
			this.watchers = {};
			for(let job of all) {
				switch(job.status.toLowerCase()) {
					case 'running':
					case 'queued':
						this.watchers[job.id] = job;
						break;
				}
			}

		}
	},
	mounted() {
		this.jobUpdater = setInterval(this.executeWatchers, 10000);
	},
	beforeDestroy() {
		if (this.jobUpdater !== null) {
			clearInterval(this.jobUpdater);
		}
	},
	methods: {
		showInEditor(job) {
			this.refreshElement(job, updatedJob => {
				this.emit('insertCustomProcess', updatedJob.process);
			});
		},
		jobCreated(job) {
			var buttons = [];
			if (this.supports('estimateJob')) {
				buttons.push({text: 'Estimate', action: () => this.estimateJob(job)});
			}
			if (this.supports('startJob')) {
				buttons.push({text: 'Start processing', action: () => this.queueJob(job)});
			}
			if (this.supports('deleteJob')) {
				buttons.push({text: 'Delete', action: () => this.deleteJob(job)});
			}
			Utils.confirm(this, 'Job created!', buttons);
		},
		getTitleField() {
			return new Field('title', 'Title', {type: 'string'});
		},
		getDescriptionField() {
			return new Field('description', 'Description', {type: 'string', format: 'commonmark'}, undefined, 'CommonMark (Markdown) is allowed.');
		},
		getBillingPlanField() {
			return new Field('plan', 'Billing plan', {type: 'string', format: 'billing-plan'});
		},
		getBudgetField() {
			return new Field('budget', 'Budget', {type: 'number', format: 'budget'}, null);
		},
		normalizeToDefaultData(data) {
			if (typeof data.title !== 'undefined' && (typeof data.title !== 'string' || data.title.length === 0)) {
				data.title = null;
			}
			if (typeof data.description !== 'undefined' && (typeof data.description !== 'string' || data.description.length === 0)) {
				data.description = null;
			}
			if (typeof data.plan !== 'undefined' && (typeof data.plan !== 'string' || data.plan.length === 0)) {
				data.plan = null;
			}
			if (typeof data.budget !== 'undefined' && (typeof data.budget !== 'number' || data.budget < 0)) {
				data.budget = null;
			}
			return data;
		},
		createJob(process, data) {
			data = this.normalizeToDefaultData(data);
			this.create({parameters: [process, data.title, data.description, data.plan, data.budget]})
				.then(job => this.jobCreated(job))
				.catch(error => Utils.exception(this, error, 'Sorry, could not create a batch job.'));
		},
		createJobFromScript() {
			this.emit('getCustomProcess', script => {
				var fields = [
					this.getTitleField(),
					this.getDescriptionField(),
					this.supportsBillingPlans ? this.getBillingPlanField() : null,
					this.supportsBilling ? this.getBudgetField() : null
				];
				this.emit('showDataForm', "Create new batch job", fields, data => this.createJob(script, data));
			});
		},
		deleteJob(job) {
			this.delete({data: job})
				.catch(error => Utils.exception(this, error, 'Sorry, could not delete job.'));
		},
		executeWatchers() {
			for(var i in this.watchers) {
				this.refreshElement(this.watchers[i], (updated, old) => {
					if (old.status !== 'finished' && updated.status === 'finished') {
						var buttons = [];
						if (this.supports('downloadResults')) {
							buttons.push({text: 'Download', action: () => this.downloadResults(updated)});
							buttons.push({text: 'View', action: () => this.viewResults(updated)});
						}
						Utils.confirm(this, 'Job has finished!', buttons);
					}
					else if (old.status !== 'error' && updated.status === 'error') {
						Utils.error(this, 'Job has stopped due to an error or timeout.');
					}
				});
			}
		},
		showJobInfo(job) {
			this.refreshElement(job, updatedJob => this.emit('showJobInfo', updatedJob.getAll()));
		},
		estimateJob(job) {
			job.estimateJob()
				.then(estimate => this.emit('showModal', 'Job Estimate', estimate))
				.catch(error => Utils.exception(this, error, "Loading estimate failed"));
		},
		replaceProcess(job) {
			this.emit('getCustomProcess', script => this.updateJob(job, {process: script}));
		},
		editMetadata(oldJob) {
			this.refreshElement(oldJob, job => {
				var fields = [
					this.getTitleField().setValue(job.title),
					this.getDescriptionField().setValue(job.description),
					this.supportsBillingPlans ? this.getBillingPlanField().setValue(job.plan) : null,
					this.supportsBilling ? this.getBudgetField().setValue(job.budget) : null
				];
				this.emit('showDataForm', "Edit batch job", fields, data => this.updateJob(job, data));
			});
		},
		updateTitle(job, newTitle) {
			this.updateJob(job, {title: newTitle});
		},
		updateJob(job, parameters) {
			this.update({data: job, parameters: this.normalizeToDefaultData(parameters)})
				.catch(error => Utils.exception(this, error, "Updating job failed"));;
		},
		queueJob(job) {
			job.startJob()
				.then(updatedJob => Utils.ok(this, "Job successfully queued."))
				.catch(error => Utils.exception(this, error, "Queueing job failed"));
		},
		cancelJob(job) {
			job.stopJob()
				.then(updatedJob => Utils.ok(this, "Job successfully canceled."))
				.catch(error => Utils.exception(this, error, "Canceling job failed"));
		},
		viewResults(job) {			
			Utils.info(this, 'Data requested. Please wait...');

			job.getResultsAsItem().then(item => {
				if(Utils.size(item.assets) == 0) {
					Utils.error(this, "No results available.");
					return;
				}

				this.emit('viewJobResults', item, job);
			});
		},
		downloadResults(job) {	
			job.getResultsAsItem().then(item => {
				if(Utils.size(item.assets) == 0) {
					Utils.error(this, "No results available.");
					return;
				}
				
				// This can be formatted much nicer and more useful...
				this.emit(
					'showListModal', 
					'Download results',
					Object.values(item.assets).map(a => a.href),
					[
						{
							callback: url => {
								window.open(url, '_blank');
								return false; // Don't close the modal by default to allow downloading multiple files
							}
						}
					]
				);
			});
		},
		hasResults(job) {
			return (typeof job.status !== 'string' || job.status.toLowerCase() == 'finished');
		},
		isJobInactive(job) {
			return (typeof job.status !== 'string' || !this.isActiveStatusCode(job.status));
		},
		isJobActive(job) {
			return (typeof job.status !== 'string' || this.isActiveStatusCode(job.status));
		},
		isActiveStatusCode(status) {
			switch (status.toLowerCase()) {
				case 'running':
				case 'queued':
					return true;
				default:
					return false;
			}
		}
	}
}
</script>

<style>
#JobPanel .job_id {
	width: 20%;
}
#JobPanel .status {
	width: 10%;
}
#JobPanel .submitted {
	width: 18%;
}
#JobPanel .updated {
	width: 18%;
}
#JobPanel .consumed_credits {
	width: 5%;
}
#JobPanel td.consumed_credits, #JobPanel td.updated, #JobPanel td.submitted {
	text-align: right;
}
</style>