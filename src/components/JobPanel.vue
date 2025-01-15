<template>
	<DataTable ref="table" fa :data="data" :columns="columns" :next="next" class="JobPanel">
		<template slot="toolbar">
			<AsyncButton title="Create a new job from the process in the process editor for batch processing" :fn="createJobFromScript" v-show="supportsCreate" :disabled="!this.hasProcess" fa confirm icon="fas fa-plus">Create Batch Job</AsyncButton>
			<AsyncButton title="Run the process in the process editor directly and view the results without storing them permanently" :fn="executeProcess" v-show="supports('computeResult')" :disabled="!this.hasProcess" fa confirm icon="fas fa-play">Run now</AsyncButton>
			<SyncButton v-if="supportsList" :name="plualizedName" :sync="reloadData" />
			<FullscreenButton :element="() => this.$el" />
		</template>
		<template #actions="p">
			<AsyncButton title="Show details about this job" :fn="() => showJobInfo(p.row)" v-show="supportsRead" fa icon="fas fa-info"></AsyncButton>
			<AsyncButton title="Create a cost and time estimate for this job" :fn="() => estimateJob(p.row)" v-show="supportsEstimate" fa icon="fas fa-file-invoice-dollar"></AsyncButton>
			<AsyncButton title="Edit the metadata of this job" :fn="() => editMetadata(p.row)" v-show="supportsUpdate" :disabled="!isJobInactive(p.row)" fa icon="fas fa-edit"></AsyncButton>
			<AsyncButton title="Edit the process of this job in the process editor" confirm :fn="() => showInEditor(p.row)" v-show="supportsRead" fa icon="fas fa-project-diagram"></AsyncButton>
			<AsyncButton title="Delete this job from the server, including all results" :fn="() => deleteJob(p.row)" v-show="supportsDelete" fa icon="fas fa-trash"></AsyncButton>
			<AsyncButton title="Start the processing on the server" :fn="() => queueJob(p.row)" v-show="supportsStart && isJobInactive(p.row)" fa icon="fas fa-play-circle"></AsyncButton>
			<AsyncButton title="Cancel the processing" :fn="() => cancelJob(p.row)" v-show="supportsStop && isJobActive(p.row)" fa icon="fas fa-stop-circle"></AsyncButton>
			<AsyncButton title="Download the results to your computer" :fn="() => downloadResults(p.row)" v-show="supportsDownloadResults && mayHaveResults(p.row)" fa icon="fas fa-download"></AsyncButton>
			<AsyncButton title="View the results" :fn="() => viewResults(p.row, true)" v-show="supportsDownloadResults && mayHaveResults(p.row)" fa icon="fas fa-eye"></AsyncButton>
			<AsyncButton title="Export and/or share this job" :fn="() => shareResults(p.row)" v-show="canShare && supports('downloadResults') && mayHaveResults(p.row)" fa icon="fas fa-share"></AsyncButton>
			<AsyncButton title="View the logs of this job" :fn="() => showLogs(p.row)" v-show="supportsDebug" fa icon="fas fa-bug"></AsyncButton>
		</template>
	</DataTable>
</template>

<script>
import EventBusMixin from './EventBusMixin';
import WorkPanelMixin from './WorkPanelMixin';
import SyncButton from './SyncButton.vue';
import FullscreenButton from './FullscreenButton.vue';
import AsyncButton from '@openeo/vue-components/components/internal/AsyncButton.vue';
import Utils from '../utils.js';
import { Job } from '@openeo/js-client';
import { cancellableRequest, showCancellableRequestError, CancellableRequestError } from './cancellableRequest';
import FieldMixin from './FieldMixin';
import StacMigrate from '@radiantearth/stac-migrate';

const WorkPanelMixinInstance = WorkPanelMixin('jobs', 'batch job', 'batch jobs');

export default {
	name: 'JobPanel',
	mixins: [
		WorkPanelMixinInstance,
		EventBusMixin,
		FieldMixin
	],
	components: {
		AsyncButton,
		FullscreenButton,
		SyncButton
	},
	data() {
		return {
			watchers: {},
			jobUpdater: null
		};
	},
	mounted() {
		this.listen('replaceProcess', this.replaceProcess);
		this.listen('executeProcess', this.executeProcess);
		this.listen('startAndQueueProcess', this.startAndQueueProcess);
	},
	computed: {
		...Utils.mapState(['connection']),
		...Utils.mapGetters(['supports', 'supportsBilling', 'supportsBillingPlans']),
		...Utils.mapGetters('editor', ['hasProcess']),
		...Utils.mapState('editor', ['process']),
		columns() {
			return {
				id: {
					name: 'ID',
					primaryKey: true,
					hide: true
				},
				title: {
					name: 'Batch Job',
					computedValue: row => Utils.getResourceTitle(row),
					format: value => Utils.formatIdOrTitle(value),
					edit: this.supportsUpdate ? this.updateTitle : null,
					width: '30%'
				},
				status: {
					name: 'Status',
					stylable: true,
					width: '10%'
				},
				created: {
					name: 'Submitted',
					format: 'Timestamp',
					sort: 'desc',
					width: '15%'
				},
				updated: {
					name: 'Last update',
					format: 'Timestamp',
					width: '15%'
				},
				actions: {
					name: 'Actions',
					filterable: false,
					sort: false,
					width: '30%'
				}
			};
		},
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
		},
		canShare() {
			return Array.isArray(this.$config.supportedBatchJobSharingServices) && this.$config.supportedBatchJobSharingServices.length > 0;
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
		async showInEditor(job) {
			await this.refreshElement(job, updatedJob => this.broadcast('editProcess', updatedJob));
		},
		async startAndQueueProcess(options) {
			let job = await this.createJob(this.process, options);
			await this.queueJob(job);
		},
		async executeProcess() {
			const callback = async (abortController) => {
				const result = await this.connection.computeResult(this.process, null, null, abortController);
				this.broadcast('viewSyncResult', result);
			};
			try {
				await cancellableRequest(this, callback, 'Run');
			} catch (error) {
				if (error instanceof CancellableRequestError) {
					showCancellableRequestError(this, error);
				}
				else {
					Utils.exception(this, error);
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
				let job = await this.create([
					process,
					data.title,
					data.description,
					data.plan,
					data.budget,
					{log_level: data.log_level}
				]);
				this.jobCreated(job);
				return job;
			} catch (error) {
				Utils.exception(this, error, 'Create Job Error: ' + (data.title || ''));
				return null;
			}
		},
		async createJobFromScript() {
			var fields = [
				this.getTitleField(),
				this.getDescriptionField(),
				this.getLogLevelField(),
				this.supportsBillingPlans ? this.getBillingPlanField() : null,
				this.supportsBilling ? this.getBudgetField() : null
			];
			return new Promise((resolve, reject) => {
				this.broadcast('showDataForm', "Create new batch job", fields, data => {
					this.createJob(this.process, data)
						.then(job => job ? resolve(job) : reject())
						.catch(reject);
				});
			});
		},
		async deleteJob(job) {
			if (!confirm(`Do you really want to delete the batch job "${Utils.getResourceTitle(job)}"?`)) {
				return;
			}

			try {
				await this.delete({data: job});
				this.broadcast('removeBatchJob', job.id);
				if (this.hasMore) {
					this.reloadData();
				}
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
						this.broadcast('jobStatusUpdated', updated, old);
					}
				});
			}
		},
		async showJobInfo(job) {
			await this.refreshElement(job, async (updatedJob) => {
				let result = null;
				if (updatedJob.status === 'finished') {
					try {
						result = await updatedJob.getResultsAsStac();
						result = StacMigrate.stac(result, false);
					} catch (error) {
						Utils.exception(this, error, "Load Results Error: " + Utils.getResourceTitle(updatedJob));
					}
				}
				this.broadcast('showModal', 'JobInfoModal', {job: updatedJob.getAll(), result});
			});
		},
		async estimateJob(job) {
			// Doesn't need to go through job store as it doesn't change job-related data
			try {
				let estimate = await job.estimateJob();
				this.broadcast('showModal', 'JobEstimateModal', {job: job.getAll(), estimate});
			} catch(error) {
				Utils.exception(this, error, "Job Estimate Error: " + Utils.getResourceTitle(job));
			}
		},
		showLogs(job) {
			this.broadcast('viewLogs', job);
		},
		async replaceProcess(job, process, resolve, reject) {
			if (job instanceof Job) {
				if (this.isJobActive(job)) {
					Utils.error(this, "Can't update process while batch job is running.");
					reject();
				}
				else {
					try {
						await this.updateJob(job, {process: process});
						resolve();
						return;
					} catch (error) {
						reject(error)
					}
				}
			}
		},
		async editMetadata(oldJob) {
			await this.refreshElement(oldJob, job => {
				var fields = [
					this.getTitleField(job.title),
					this.getDescriptionField(job.description),
					this.getLogLevelField(job.log_level),
					this.supportsBillingPlans ? this.getBillingPlanField(job.plan) : null,
					this.supportsBilling ? this.getBudgetField(job.budget) : null
				];
				this.broadcast('showDataForm', "Edit batch job", fields, data => this.updateJob(job, data));
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
			await this.refreshElement(job, async (updatedJob) => {
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
				stac = StacMigrate.stac(stac, false);
				this.broadcast('viewJobResults', stac, job);
			} catch(error) {
				Utils.exception(this, error, 'View Result Error: ' + Utils.getResourceTitle(job));
			}
		},
		async downloadResults(job) {
			// Doesn't need to go through job store as it doesn't change job-related data
			try {
				let result = await job.getResultsAsStac();
				result = StacMigrate.stac(result, false);
				if(Utils.size(result.assets) == 0) {
					Utils.error(this, 'No results available for job "' + Utils.getResourceTitle(job) + '".');
					return;
				}
				this.broadcast('showModal', 'DownloadAssetsModal', {job, result});
			} catch(error) {
				Utils.exception(this, error, 'Download Result Error: ' + Utils.getResourceTitle(job));
			}
		},
		async shareResults(job) {
			if (this.canShare) {
				let result = await job.getResultsAsStac();
				result = StacMigrate.stac(result, false);
				let url;
				let link;
				if (Array.isArray(result.links)) {
					link = result.links.find(link => link.rel === 'canonical');
					if (link && typeof link.href === 'string') {
						url = link.href;
					}
				}
				if (url) {
					let title = result.properties?.title || job.title || link?.title;
					this.broadcast('showModal', 'ShareModal', {url, title, extra: result, context: job});
				}
				else {
					Utils.error(this, "Sorry, this job has no public URL");
				}
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
	.title .id {
		color: #777;
	}
	.consumed_credits, .updated, .created {
		text-align: right;
	}
}
</style>
