<template>
	<DataTable ref="table" :data="data" :columns="columns" class="JobPanel">
		<template slot="toolbar">
			<button title="Add new job for batch processing" @click="createJobFromScript()" v-show="supportsCreate"><i class="fas fa-plus"></i> Create</button>
			<button title="Run process and view results synchronously" @click="executeProcess" v-show="supports('computeResult')"><i class="fas fa-play"></i> Run now</button>
		</template>
		<template #actions="p">
			<button title="Details" @click="showJobInfo(p.row)" v-show="supportsRead"><i class="fas fa-info"></i></button>
			<button title="Estimate" @click="estimateJob(p.row)" v-show="supports('estimateJob')"><i class="fas fa-file-invoice-dollar"></i></button>
			<button title="Edit metadata" @click="editMetadata(p.row)" v-show="supportsUpdate && isJobInactive(p.row)"><i class="fas fa-edit"></i></button>
			<button title="Edit process" @click="showInEditor(p.row)" v-show="supportsRead && isJobInactive(p.row)"><i class="fas fa-project-diagram"></i></button>
			<button title="Delete" @click="deleteJob(p.row)" v-show="supportsDelete"><i class="fas fa-trash"></i></button>
			<button title="Start processing" @click="queueJob(p.row)" v-show="supports('startJob') && isJobInactive(p.row)"><i class="fas fa-play-circle"></i></button>
			<button title="Cancel processing" @click="cancelJob(p.row)" v-show="supports('stopJob') && isJobActive(p.row)"><i class="fas fa-stop-circle"></i></button>
			<button title="Download" @click="downloadResults(p.row)" v-show="supports('downloadResults') && hasResults(p.row)"><i class="fas fa-download"></i></button>
			<button title="View results" @click="viewResults(p.row, true)" v-show="supports('downloadResults') && hasResults(p.row)"><i class="fas fa-eye"></i></button>
			<button title="View logs" @click="showLogs(p.row)" v-show="supports('debugJob')"><i class="fas fa-bug"></i></button>
		</template>
	</DataTable>
</template>

<script>
import EventBusMixin from './EventBusMixin.vue';
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
					format: 'Timestamp',
					sort: 'desc'
				},
				updated: {
					name: 'Last update',
					format: 'Timestamp'
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
		async createJob(process, data) {
			try {
				data = this.normalizeToDefaultData(data);
				let job = await this.create({parameters: [process, data.title, data.description, data.plan, data.budget]});
				this.jobCreated(job);
			} catch (error) {
				Utils.exception(this, error, 'Create Job Error: ' + (data.title || ''));
			}
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
				.catch(error => Utils.exception(this, error, 'Delete Job Error: ' + Utils.getResourceTitle(job)));
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

					if (old.status !== updated.status) {
						this.emit('jobStatusUpdated', updated, old);
					}
				});
			}
		},
		async showJobInfo(job) {
			this.refreshElement(job, async (updatedJob) => {
				let result = null;
				if (updatedJob.status === 'finished') {
					try {
						result = await updatedJob.getResultsAsStac();
					} catch (error) {
						Utils.exception(this, error, "Load Results Error: " + Utils.getResourceTitle(updatedJob));
					}
				}
				this.emit('showModal', 'JobInfoModal', {job: updatedJob.getAll(), result});
			});
		},
		async estimateJob(job) {
			// Doesn't need to go through job store as it doesn't change job-related data
			try {
				let estimate = await job.estimateJob();
				this.emit('showModal', 'JobEstimateModal', {job: job.getAll(), estimate});
			} catch(error) {
				Utils.exception(this, error, "Job Estimate Error: " + Utils.getResourceTitle(job));
			}
		},
		showLogs(job) {
			this.emit('viewLogs', job);
		},
		replaceProcess(job, process) {
			if (job instanceof Job) {
				if (this.isJobActive(job)) {
					Utils.error(this, "Can't update process while batch job is running.");
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
		async updateJob(job, parameters) {
			try {
				let updatedJob = await this.update({data: job, parameters: this.normalizeToDefaultData(parameters)});
				Utils.ok(this, 'Job "' + Utils.getResourceTitle(updatedJob) + '" successfully updated.');
			} catch(error) {
				Utils.exception(this, error, 'Update Job Error: ' + Utils.getResourceTitle(job));
			}
		},
		async queueJob(job) {
			try {
				let updatedJob = await this.queue({data: job});
				Utils.ok(this, 'Job "' + Utils.getResourceTitle(updatedJob) + '" successfully queued.');
			} catch(error) {
				Utils.exception(this, error, 'Queue Job Error: ' + Utils.getResourceTitle(job));
			}
		},
		async cancelJob(job) {
			try {
				let updatedJob = await this.cancel({data: job});
				Utils.ok(this, 'Job "' + Utils.getResourceTitle(updatedJob) + '" successfully canceled.');
			} catch(error) {
				Utils.exception(this, error, 'Cancel Job Error: ' + Utils.getResourceTitle(job));
			}
		},
		async viewResults(job) {			
			// Doesn't need to go through job store as it doesn't change job-related data
			try {
				let stac = await job.getResultsAsStac()
				if(Utils.size(stac.assets) == 0) {
					Utils.error(this, 'No results available for job "' + Utils.getResourceTitle(job) + '".');
					return;
				}
				this.emit('viewJobResults', stac, job);
			} catch(error) {
				Utils.exception(this, error, 'View Result Error: ' + Utils.getResourceTitle(job));
			}
		},
		async downloadResults(job) {	
			// Doesn't need to go through job store as it doesn't change job-related data
			try {
				let stac = await job.getResultsAsStac();
				if(Utils.size(stac.assets) == 0) {
					Utils.error(this, 'No results available for job "' + Utils.getResourceTitle(job) + '".');
					return;
				}
				// ToDo: This can be formatted much nicer and more useful...
				this.emit(
					'showListModal', 
					'Download results',
					Object.values(stac.assets).map(a => a.href),
					[
						{
							callback: url => {
								window.open(url, '_blank');
								return false; // Don't close the modal by default to allow downloading multiple files
							}
						}
					]
				);
			} catch(error) {
				Utils.exception(this, error, 'Download Result Error: ' + Utils.getResourceTitle(job));
			}
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
.JobPanel .title {
	width: 25%;
}
.JobPanel .consumed_credits, .JobPanel .updated, .JobPanel .created {
	text-align: right;
}
</style>