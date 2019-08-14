<template>
	<DataTable ref="table" :dataSource="listJobs" :columns="columns" id="JobPanel" v-if="connection">
		<template slot="toolbar">
			<button title="Add new job" @click="createJobFromScript()" v-show="supports('createJob')"><i class="fas fa-plus"></i> Add</button>
			<button title="Refresh jobs" @click="updateData()" v-show="supports('listJobs')"><i class="fas fa-sync-alt"></i></button> <!-- ToDo: Should be done automatically later -->
		</template>
		<template slot="actions" slot-scope="p">
			<button title="Details" @click="showJobInfo(p.row)" v-show="supports('describeJob')"><i class="fas fa-info"></i></button>
			<button title="Show in Editor" @click="showInEditor(p.row)" v-show="supports('describeJob')"><i class="fas fa-code-branch"></i></button>
			<button title="Estimate" @click="estimateJob(p.row)" v-show="supports('estimateJob')"><i class="fas fa-file-invoice-dollar"></i></button>
			<button title="Edit metadata" @click="editMetadata(p.row)" v-show="supports('updateJob') && isJobInactive(p.row)"><i class="fas fa-edit"></i></button>
			<button title="Replace process graph" @click="replaceProcessGraph(p.row)" v-show="supports('updateJob') && isJobInactive(p.row)"><i class="fas fa-retweet"></i></button>
			<button title="Delete" @click="deleteJob(p.row)" v-show="supports('deleteJob')"><i class="fas fa-trash"></i></button>
			<button title="Start processing" @click="queueJob(p.row)" v-show="supports('startJob') && isJobInactive(p.row)"><i class="fas fa-play-circle"></i></button>
			<button title="Cancel processing" @click="cancelJob(p.row)" v-show="supports('stopJob') && isJobActive(p.row)"><i class="fas fa-stop-circle"></i></button>
			<button title="Download" @click="downloadResults(p.row)" v-show="supports('downloadResults') && hasResults(p.row)"><i class="fas fa-download"></i></button>
			<button title="View results" @click="viewResults(p.row, true)" v-show="supports('downloadResults') && hasResults(p.row)"><i class="fas fa-eye"></i></button>
		<!--<button title="Subscribe" @click="subscribeToJob(p.row)" v-show="supports('subscribe') && !jobSubscriptions.includes(p.row)"><i class="fas fa-bell"></i></button>
			<button title="Unsubscribe" @click="unsubscribeFromJob(p.row)" v-show="supports('unsubscribe') && jobSubscriptions.includes(p.row)"><i class="fas fa-bell-slash"></i></button>-->
		</template>
	</DataTable>
</template>

<script>
import EventBus from '@openeo/vue-components/eventbus.js';
import WorkPanelMixin from './WorkPanelMixin.vue';
import Utils from '../utils.js';
import Field from './blocks/field';

export default {
	name: 'JobPanel',
	mixins: [WorkPanelMixin],
	data() {
		return {
			columns: {
				jobId: {
					name: 'ID',
					primaryKey: true,
					hide: true
				},
				title: {
					name: 'Title',
					computedValue: (row, value) => {
						if (!value && row.jobId) {
							return "Job #" + row.jobId.toUpperCase().substr(-6);
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
			jobSubscriptions: [],
			watchers: []
		};
	},
	computed: {
		...Utils.mapGetters('server', ['supportsBilling', 'supportsBillingPlans'])
	},
	mounted() {
		window.setInterval(this.executeWatchers, 10000);
	},
	methods: {
		listJobs() {
			return this.connection.listJobs();
		},
		updateData() {
			this.updateTable(this.$refs.table, 'listJobs', 'createJob');
		},
		refreshJob(job, callback = null) {
			var oldJob = Object.assign({}, job);
			job.describeJob()
				.then(updatedJob => {
					if (typeof callback === 'function') {
						callback(updatedJob, oldJob);
					}
					this.updateJobData(updatedJob);
				})
				.catch(error => Utils.exception(this, error, "Loading job failed"));
		},
		showInEditor(job) {
			this.refreshJob(job, updatedJob => {
				EventBus.$emit('insertProcessGraph', updatedJob.processGraph);
			});
		},
		jobCreated(job) {
			if (!this.$refs.table) {
				return;
			}

			this.$refs.table.addData(job);

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
			return new Field('description', 'Description', {type: 'string', format: 'commonmark'}, 'CommonMark (Markdown) is allowed.');
		},
		getBillingPlanField() {
			return new Field('plan', 'Billing plan', {type: 'string', format: 'billing-plan'});
		},
		getBudgetField() {
			return new Field('budget', 'Budget', {type: 'number', format: 'budget', default: null});
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
		createJob(processGraph, data) {
			data = this.normalizeToDefaultData(data);
			this.connection.createJob(processGraph, data.title, data.description, data.plan, data.budget)
				.then(job => {
					this.jobCreated(job);
				}).catch(error => {
					Utils.exception(this, error, 'Sorry, could not create a batch job.');
				});
		},
		createJobFromScript() {
			EventBus.$emit('getProcessGraph', script => {
				var fields = [
					this.getTitleField(),
					this.getDescriptionField(),
					this.supportsBillingPlans ? this.getBillingPlanField() : null,
					this.supportsBilling ? this.getBudgetField() : null
				];
				EventBus.$emit('showDataForm', "Create new batch job", fields, data => this.createJob(script, data));
			});
		},
		updateJobData(updatedJob) {
			this.$refs.table.replaceData(updatedJob);

			// Watchers
			var index = this.watchers.findIndex(j => j.jobId == updatedJob.jobId);
			switch(updatedJob.status.toLowerCase()) {
				case 'running':
				case 'queued':
					if (index === -1) {
						this.watchers.push(updatedJob);
					}
					break;
				default:
					this.watchers.splice(index, 1);
			}
		},
		deleteJob(job) {
			job.deleteJob()
				.then(() => {
					this.$refs.table.removeData(job.jobId);
				})
				.catch(error => {
					Utils.exception(this, error, 'Sorry, could not delete job.');
				});
		},
		executeWatchers() {
			for(var i in this.watchers) {
				this.refreshJob(this.watchers[i], (updated, old) => {
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
			this.refreshJob(job, updatedJob => {
				EventBus.$emit('showJobInfo', updatedJob.getAll());
			});
		},
		estimateJob(job) {
			job.estimateJob()
				.then(estimate => {
					EventBus.$emit('showModal', 'Job Estimate', estimate);
				})
				.catch(error => Utils.exception(this, error, "Loading estimate failed"));
		},
		replaceProcessGraph(job) {
			EventBus.$emit('getProcessGraph', script => {
				this.updateJob(job, {processGraph: script});
			});
		},
		editMetadata(oldJob) {
			this.refreshJob(oldJob, job => {
				var fields = [
					this.getTitleField().setValue(job.title),
					this.getDescriptionField().setValue(job.description),
					this.supportsBillingPlans ? this.getBillingPlanField().setValue(job.plan) : null,
					this.supportsBilling ? this.getBudgetField().setValue(job.budget) : null
				];
				EventBus.$emit('showDataForm', "Edit batch job", fields, data => this.updateJob(job, data));
			});
		},
		updateTitle(job, newTitle) {
			this.updateJob(job, {title: newTitle});
		},
		updateJob(job, data) {
			data = this.normalizeToDefaultData(data);
			job.updateJob(data)
				.then(updatedJob => {
					Utils.ok(this, "Job successfully updated.");
					this.updateJobData(updatedJob);
				})
				.catch(error => Utils.exception(this, error, "Updating job failed"));;
		},
		queueJob(job) {
			job.startJob()
				.then(updatedJob => {
					Utils.ok(this, "Job successfully queued.");
					this.updateJobData(updatedJob);
				})
				.catch(error => Utils.exception(this, error, "Queueing job failed"));
		},
		cancelJob(job) {
			job.stopJob()
				.then(updatedJob => {
					Utils.ok(this, "Job successfully canceled.");
					this.updateJobData(updatedJob);
				})
				.catch(error => Utils.exception(this, error, "Canceling job failed"));
		},
		viewResults(job) {			
			job.listResults().then(info => {
				if(info.links.length == 0) {
					Utils.error(this, "No download available.");
					return;
				} else if (info.links.length > 1) {
					Utils.info(this, "Job resulted in multiple files, please download them individually.");
					return;
				}

				Utils.info(this, 'Data requested. Please wait...');
				// Send requests without authentication (second parameter false), they should be secured by a token in the URL
				this.connection.download(info.links[0].href, false)
					.then(response => EventBus.$emit('showViewer', response.data, info.links[0].type))
					.catch(error => {
						Utils.exception(this, error, "Sorry, can't download results.");
					});
			});
		},
		downloadResults(job) {	
			job.listResults().then(info => {
				if(!Array.isArray(info.links) || info.links.length == 0) {
					Utils.error(this, "No download available.");
				}
				else {
					// This can be formatted much nicer and more useful...
					var urls = info.links.map(v => v.href);
					EventBus.$emit(
						'showListModal', 
						'Download results' + (info.title ? ' for: ' + info.title : ''),
						urls,
						[
							{
								callback: url => {
									window.open(url, '_blank');
									return false; // Don't close the modal by default to allow downloading multiple files
								}
							}
						]
					);
				}
			});
		},
		subscribeToJob(id) {  // TODO-CF: Upgrade when js-client supports it again
			var params = {job_id: id};
			this.connection.subscribe(
				'openeo.jobs.debug', params,
				(data, info) => {
					console.info("Debugging information for job " + id + ": " + JSON.stringify(data));
				}
			);
			this.connection.subscribe(
				'openeo.jobs.output', params,
				(data, info) => {
					console.info("Output from job " + id + ": " + JSON.stringify(data));
				}
			);
			this.connection.subscribe(
				'openeo.jobs.status', params,
				(data, info) => {
					console.info("Status information for job " + id + ": " + JSON.stringify(data));
				}
			);
			this.jobSubscriptions.push(id);
		},
		unsubscribeFromJob(id) {  // TODO-CF: Upgrade when js-client supports it again
			var params = {job_id: id};
			this.connection.unsubscribe('openeo.jobs.debug', params);
			this.connection.unsubscribe('openeo.jobs.output', params);
			this.connection.unsubscribe('openeo.jobs.status', params);
			this.jobSubscriptions.splice(this.jobSubscriptions.indexOf(id), 1);
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