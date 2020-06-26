<template>
	<DataTable ref="table" :data="data" :columns="columns" id="JobPanel">
		<template slot="toolbar">
			<button title="Add new job for batch processing" @click="createJobFromScript()" v-show="supportsCreate"><i class="fas fa-plus"></i> Create</button>
			<button title="Run process and view results synchronously" @click="executeProcess" v-show="supports('computeResult')"><i class="fas fa-play"></i> Run now</button>
		</template>
		<template slot="actions" slot-scope="p">
			<button title="Details" @click="showJobInfo(p.row)" v-show="supportsRead"><i class="fas fa-info"></i></button>
			<button title="Estimate" @click="estimateJob(p.row)" v-show="supports('estimateJob')"><i class="fas fa-file-invoice-dollar"></i></button>
			<button title="Edit metadata" @click="editMetadata(p.row)" v-show="supportsUpdate && isJobInactive(p.row)"><i class="fas fa-edit"></i></button>
			<button title="Edit process" @click="showInEditor(p.row)" v-show="supportsRead && isJobInactive(p.row)"><i class="fas fa-project-diagram"></i></button>
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
import { Job } from '@openeo/js-client';

const WorkPanelMixinInstance = WorkPanelMixin('jobs', 'batch job', 'batch jobs');

export default {
	name: 'JobPanel',
	mixins: [WorkPanelMixinInstance, EventBusMixin],
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
					computedValue: row => Utils.getResourceTitle(row),
					edit: this.updateTitle
				},
				status: {
					name: 'Status',
					stylable: true
				},
				created: {
					name: 'Submitted',
					format: 'DateTime',
					sort: 'desc'
				},
				updated: {
					name: 'Last update',
					format: 'DateTime'
				},
				actions: {
					name: 'Actions',
					filterable: false,
					sort: false
				}
			},
			watchers: {},
			jobUpdater: null
		};
	},
	mounted() {
		this.listen('replaceProcess', this.replaceProcess);
	},
	computed: {
		...Utils.mapGetters(['supports', 'supportsBilling', 'supportsBillingPlans']),
		...Utils.mapState('editor', ['process'])
	},
	watch: {
		data: {
			handler: function(updatedJobs) {
				// Update Watchers
				this.watchers = {};
				for(let job of updatedJobs) {
					switch(job.status.toLowerCase()) {
						case 'running':
						case 'queued':
							this.watchers[job.id] = job;
							break;
					}
				}
			},
			deep: true
		}
	},
	methods: {
		...Utils.mapActions('jobs', ['queue', 'cancel']),
		startSyncTimer() {
			WorkPanelMixinInstance.methods.startSyncTimer.call(this);
			this.jobUpdater = setInterval(this.executeWatchers, 10000);
		},
		stopSyncTimer() {
			WorkPanelMixinInstance.methods.stopSyncTimer.call(this);
			if (this.jobUpdater !== null) {
				clearInterval(this.jobUpdater);
			}
		},
		showInEditor(job) {
			this.refreshElement(job, updatedJob => this.emit('editProcess', updatedJob));
		},
		executeProcess() {
			Utils.info(this, 'Data requested. Please wait...');
			this.emit('viewSyncResult', this.process);
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
			Utils.confirm(this, 'Job "' + Utils.getResourceTitle(job) + '" created!', buttons);
		},
		getTitleField(value = null) {
			return {
				name: 'title',
				label: 'Title',
				schema: {type: 'string'},
				default: null,
				value: value,
				optional: true
			};
		},
		getDescriptionField(value = null) {
			return {
				name: 'description',
				label: 'Description',
				schema: {type: 'string', subtype: 'commonmark'},
				default: null,
				value: value,
				description: 'CommonMark (Markdown) is allowed.',
				optional: true
			};
		},
		getBillingPlanField(value = undefined) {
			return {
				name: 'plan',
				label: 'Billing plan',
				schema: {type: 'string', subtype: 'billing-plan'},
				value: value,
				optional: true
			};
		},
		getBudgetField(value = null) {
			return {
				name: 'budget',
				label: 'Budget',
				schema: {type: 'number', subtype: 'budget'},
				default: null,
				value: value,
				optional: true
			};
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
			var fields = [
				this.getTitleField(),
				this.getDescriptionField(),
				this.supportsBillingPlans ? this.getBillingPlanField() : null,
				this.supportsBilling ? this.getBudgetField() : null
			];
			this.emit('showDataForm', "Create new batch job", fields, data => this.createJob(this.process, data));
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
						Utils.confirm(this, 'Job "' + Utils.getResourceTitle(updated) + '" has finished!', buttons);
					}
					else if (old.status !== 'error' && updated.status === 'error') {
						Utils.error(this, 'Job "' + Utils.getResourceTitle(updated) + '" has stopped due to an error or timeout.');
					}
				});
			}
		},
		showJobInfo(job) {
			this.refreshElement(job, updatedJob => this.emit('showJobInfo', updatedJob.getAll()));
		},
		estimateJob(job) {
			// Doesn't need to go through job store as it doesn't change job-related data
			job.estimateJob()
				.then(estimate => this.emit('showModal', 'Job Estimate', estimate))
				.catch(error => Utils.exception(this, error, "Loading estimate failed"));
		},
		replaceProcess(job, process) {
			if (job instanceof Job) {
				if (this.isJobActive(job)) {
					Utils.error(this, "Can't change process while batch job is running.");
				}
				else {
					this.updateJob(job, {process: process});
				}
			}
		},
		editMetadata(oldJob) {
			this.refreshElement(oldJob, job => {
				var fields = [
					this.getTitleField(job.title),
					this.getDescriptionField(job.description),
					this.supportsBillingPlans ? this.getBillingPlanField(job.plan) : null,
					this.supportsBilling ? this.getBudgetField(job.budget) : null
				];
				this.emit('showDataForm', "Edit batch job", fields, data => this.updateJob(job, data));
			});
		},
		updateTitle(job, newTitle) {
			this.updateJob(job, {title: newTitle});
		},
		updateJob(job, parameters) {
			this.update({data: job, parameters: this.normalizeToDefaultData(parameters)})
				.catch(error => Utils.exception(this, error, 'Failed to update job "' + Utils.getResourceTitle(job) + '"'));
		},
		queueJob(job) {
			this.queue({data: job})
				.then(updatedJob => Utils.ok(this, 'Job "' + Utils.getResourceTitle(updatedJob) + '" successfully queued.'))
				.catch(error => Utils.exception(this, error, 'Failed to queue job "' + Utils.getResourceTitle(job) + '"'));
		},
		cancelJob(job) {
			this.cancel({data: job})
				.then(updatedJob => Utils.ok(this, 'Job "' + Utils.getResourceTitle(updatedJob) + '" successfully canceled.'))
				.catch(error => Utils.exception(this, error, 'Failed to cancel job "' + Utils.getResourceTitle(job) + '"'));
		},
		viewResults(job) {			
			Utils.info(this, 'Data requested. Please wait...');

			// Doesn't need to go through job store as it doesn't change job-related data
			job.getResultsAsItem().then(item => {
				if(Utils.size(item.assets) == 0) {
					Utils.error(this, 'No results available for job "' + Utils.getResourceTitle(job) + '".');
					return;
				}

				this.emit('viewJobResults', item, job);
			});
		},
		downloadResults(job) {	
			// Doesn't need to go through job store as it doesn't change job-related data
			job.getResultsAsItem().then(item => {
				if(Utils.size(item.assets) == 0) {
					Utils.error(this, 'No results available for job "' + Utils.getResourceTitle(job) + '".');
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
#JobPanel .created {
	width: 18%;
}
#JobPanel .updated {
	width: 18%;
}
#JobPanel .consumed_credits {
	width: 5%;
}
#JobPanel td.consumed_credits, #JobPanel td.updated, #JobPanel td.created {
	text-align: right;
}
</style>