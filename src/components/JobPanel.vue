<template>
	<DataTable ref="table" :data="data" :columns="columns" class="JobPanel">
		<template slot="toolbar">
			<button title="Add new job for batch processing" @click="createJobFromScript()" v-show="supportsCreate" :disabled="!this.hasProcess"><i class="fas fa-plus"></i> Create Batch Job</button>
			<button title="Run the process directly and view the results without storing them permanently" @click="executeProcess" v-show="supports('computeResult')" :disabled="!this.hasProcess"><i class="fas fa-play"></i> Run now</button>
		</template>
		<template #actions="p">
			<button title="Details" @click="showJobInfo(p.row)" v-show="supportsRead"><i class="fas fa-info"></i></button>
			<button title="Estimate" @click="estimateJob(p.row)" v-show="supportsEstimate"><i class="fas fa-file-invoice-dollar"></i></button>
			<button title="Edit metadata" @click="editMetadata(p.row)" v-show="supportsUpdate" :disabled="!isJobInactive(p.row)"><i class="fas fa-edit"></i></button>
			<button title="Edit process" @click="showInEditor(p.row)" v-show="supportsRead"><i class="fas fa-project-diagram"></i></button>
			<button title="Delete" @click="deleteJob(p.row)" v-show="supportsDelete"><i class="fas fa-trash"></i></button>
			<button title="Start processing" @click="queueJob(p.row)" v-show="supportsStart && isJobInactive(p.row)"><i class="fas fa-play-circle"></i></button>
			<button title="Cancel processing" @click="cancelJob(p.row)" v-show="supportsStop && isJobActive(p.row)"><i class="fas fa-stop-circle"></i></button>
			<button title="Download" @click="downloadResults(p.row)" v-show="supportsDownloadResults && mayHaveResults(p.row)"><i class="fas fa-download"></i></button>
			<button title="View results" @click="viewResults(p.row, true)" v-show="supportsDownloadResults && mayHaveResults(p.row)"><i class="fas fa-eye"></i></button>
			<button title="View logs" @click="showLogs(p.row)" v-show="supportsDebug"><i class="fas fa-bug"></i></button>
		</template>
	</DataTable>
</template>

<script>
import EventBusMixin from './EventBusMixin.vue';
import WorkPanelMixin from './WorkPanelMixin';
import Utils from '../utils.js';
import { AbortController, Job } from '@openeo/js-client';

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
					name: 'Batch Job',
					computedValue: row => Utils.getResourceTitle(row),
					format: value => Utils.formatIdOrTitle(value),
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
			jobUpdater: null,
			runId: 0
		};
	},
	mounted() {
		this.listen('replaceProcess', this.replaceProcess);
	},
	computed: {
		...Utils.mapState(['connection']),
		...Utils.mapGetters(['supports', 'supportsBilling', 'supportsBillingPlans']),
		...Utils.mapGetters('editor', ['hasProcess']),
		...Utils.mapState('editor', ['process']),
		supportsStart() {
			return this.supports('startJob');
		},
		supportsStop() {
			return this.supports('stopJob');
		},
		supportsEstimate() {
			return this.supports('estimateJob');
		},
		supportsDownloadResults() {
			return this.supports('downloadResults');
		},
		supportsDebug() {
			return this.supports('debugJob');
		}
		
	},
	watch: {
		data: {
			handler: function(updatedJobs) {
				// Update Watchers
				this.watchers = {};
				for(let job of updatedJobs) {
					if (Utils.isActiveJobStatusCode(job.status)) {
						this.watchers[job.id] = job;
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
			// Use setTimeout instead of setInterval to be able to slow down the refresh time based on the number of watchers
			let fn = () => {
				this.executeWatchers();
				let interval = 5 + 5*Math.log2(Utils.size(this.watchers));
				this.jobUpdater = setTimeout(fn, interval * 1000);
			};
			fn();
		},
		stopSyncTimer() {
			WorkPanelMixinInstance.methods.stopSyncTimer.call(this);
			if (this.jobUpdater !== null) {
				clearTimeout(this.jobUpdater);
			}
		},
		showInEditor(job) {
			this.refreshElement(job, updatedJob => this.emit('editProcess', updatedJob));
		},
		async executeProcess() {
			let abortController = new AbortController();
			let snotifyConfig = {
				timeout: 0,
				type: 'async',
				buttons: [{
					text: 'Cancel',
					action: toast => {
						abortController.abort();
						this.$snotify.remove(toast.id, true);
					}
				}]
			};
			let toast;
			try {
				this.runId++;
				let message = "A process is currently executed synchronously...";
				let title = `Run #${this.runId}`;
				let endlessPromise = () => new Promise(() => {}); // Pass a promise to snotify that never resolves as we manually close the toast
				toast = this.$snotify.async(message, title, endlessPromise, snotifyConfig);
				let result = await this.connection.computeResult(this.process, null, null, abortController);
				if (result.logs.length > 0) {
					this.emit('viewLogs', result.logs);
				}
				this.emit('viewSyncResult', result);
			} catch(error) {
				if (axios.isCancel(error)) {
					// Do nothing, we expected the cancellation
				}
				else if (typeof error.message === 'string' && Utils.isObject(error.response) && [400,500].includes(error.response.status)) {
					this.emit('viewLogs', [{
						id: error.id,
						code: error.code,
						level: 'error',
						message: error.message,
						links: error.links || []
					}]);
					Utils.error(this, "Synchronous processing failed. Please see the logs for details.", "Processing Error");
				}
				else {
					Utils.exception(this, error, "Server Error");
				}
			} finally {
				if (toast) {
					this.$snotify.remove(toast.id, true);
				}
			}
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
		async deleteJob(job) {
			if (!confirm(`Do you really want to delete the batch job "${Utils.getResourceTitle(job)}"?`)) {
				return;
			}

			try {
				await this.delete({data: job});
				this.emit('removeBatchJob', job.id);
			} catch(error) {
				Utils.exception(this, error, 'Delete Job Error: ' + Utils.getResourceTitle(job));
			}
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
		showJobInfo(job) {
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
		queueJob(job) {
			this.refreshElement(job, async (updatedJob) => {
				if (updatedJob.status === 'finished' && !confirm(`The batch job "${Utils.getResourceTitle(updatedJob)}" has already finished with results. Queueing the job again may discard all previous results! Do you really want to queue it again?`)) {
					return;
				}
				
				try {
					let updatedJob = await this.queue({data: job});
					Utils.ok(this, 'Job "' + Utils.getResourceTitle(updatedJob) + '" successfully queued.');
				} catch(error) {
					Utils.exception(this, error, 'Queue Job Error: ' + Utils.getResourceTitle(job));
				}
			});
		},
		async cancelJob(job) {
			if (!confirm(`Do you really want to cancel the execution of batch job "${Utils.getResourceTitle(job)}"?`)) {
				return;
			}
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
				let stac = await job.getResultsAsStac();
				this.emit('viewJobResults', stac, job);
			} catch(error) {
				Utils.exception(this, error, 'View Result Error: ' + Utils.getResourceTitle(job));
			}
		},
		async downloadResults(job) {	
			// Doesn't need to go through job store as it doesn't change job-related data
			try {
				let result = await job.getResultsAsStac();
				if(Utils.size(result.assets) == 0) {
					Utils.error(this, 'No results available for job "' + Utils.getResourceTitle(job) + '".');
					return;
				}
				this.emit('showModal', 'DownloadAssetsModal', {job, result});
			} catch(error) {
				Utils.exception(this, error, 'Download Result Error: ' + Utils.getResourceTitle(job));
			}
		},
		mayHaveResults(job) {
			return (typeof job.status !== 'string' || job.status.toLowerCase() == 'finished'); // todo: We may also want to check for canceled or errored here.
		},
		isJobInactive(job) {
			return Utils.isActiveJobStatusCode(job.status) !== true;
		},
		isJobActive(job) {
			return Utils.isActiveJobStatusCode(job.status) !== false;
		}
	}
}
</script>

<style lang="scss">
.JobPanel {
	.title {
		width: 25%;

		.id {
			color: #777;
		}
	}
	.consumed_credits, .updated, .created {
		text-align: right;
	}
}
</style>
