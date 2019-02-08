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
			<button title="Edit" @click="editJob(p.row)" v-show="supports('updateJob') && isJobInactive(p.row)"><i class="fas fa-edit"></i></button>
			<button title="Delete" @click="deleteJob(p.row)" v-show="supports('deleteJob')"><i class="fas fa-trash"></i></button>
			<button title="Start processing" @click="queueJob(p.row)" v-show="supports('startJob') && isJobInactive(p.row)"><i class="fas fa-play-circle"></i></button>
			<button title="Cancel processing" @click="cancelJob(p.row)" v-show="supports('stopJob') && isJobActive(p.row)"><i class="fas fa-stop-circle"></i></button>
			<button title="Download" @click="downloadResults(p.row)" v-show="supports('downloadResults') && hasResults(p.row)"><i class="fas fa-download"></i></button>
			<button title="View results" @click="viewResults(p.row, true)" v-show="supports('downloadResults') && hasResults(p.row)"><i class="fas fa-eye"></i></button>
			<button title="Subscribe" @click="subscribeToJob(p.row)" v-show="supports('subscribe') && !jobSubscriptions.includes(p.row)"><i class="fas fa-bell"></i></button>
			<button title="Unsubscribe" @click="unsubscribeFromJob(p.row)" v-show="supports('unsubscribe') && jobSubscriptions.includes(p.row)"><i class="fas fa-bell-slash"></i></button>
		</template>
	</DataTable>
</template>

<script>
import EventBus from '../eventbus.js';
import WorkPanelMixin from './WorkPanelMixin.vue';

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
					}
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
	created() {
		EventBus.$on('jobCreated', this.jobCreated);
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
				.catch(error => this.$utils.exception(this, error, "Sorry, could not load job information."));
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
			this.$utils.confirm(this, 'Job created!', buttons);
		},
		createJob(processGraph, outputFormat = null, outputParameters = {}, title = null) {
			if (!outputFormat) {
				outputFormat = null;
			}
			this.connection.createJob(processGraph, outputFormat, outputParameters, title)
				.then(job => {
					EventBus.$emit('jobCreated', job);
				}).catch(error => {
					this.$utils.exception(this, error, 'Sorry, could not create a batch job.');
				});
		},
		createJobFromScript() {
			var title = prompt("Please specify a title for the job:");
			if (title === null) {
				return;
			}
			else if (typeof title !== 'string' || title.length === 0) {
				title = null;
			}

			var supportedFormats = Object.keys(this.connection.supportedOutputFormats.formats).map(v => v.toUpperCase());
			var format = this.connection.supportedOutputFormats.default;
			do {
				var msgPrefix = '';
				if (format !== this.connection.supportedOutputFormats.default) {
					msgPrefix = "Specified file format is invalid.\r\n";
				}
				var format = prompt(msgPrefix + 'Please specify the targeted file format:', format);
				if (format === null) {
					return;
				}
				else if (typeof format === 'string') {
					format = format.toUpperCase();
					if (!supportedFormats.includes(format)) {
						format = '';
					}
				}
				else {
					format = '';
				}
			} while(format.length == 0);

			EventBus.$emit('getProcessGraph', (script) => {
				this.createJob(script, format, {}, title);
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
					delete this.watchers[index];
			}
		},
		deleteJob(job) {
			job.deleteJob()
				.then(() => {
					this.$refs.table.removeData(job.jobId);
				})
				.catch(error => {
					this.$utils.exception(this, error, 'Sorry, could not delete job.');
				});
		},
		executeWatchers() {
			for(var i in this.watchers) {
				this.refreshJob(this.watchers[i], (updated, old) => {
					console.log(updated.status, old.status, updated, old);
					if (old.status !== 'finished' && updated.status === 'finished') {
						var buttons = [];
						if (this.supports('downloadResults')) {
							buttons.push({text: 'Download', action: () => this.downloadResults(job)});
							buttons.push({text: 'View', action: () => this.viewResults(job)});
						}
						this.$utils.confirm(this, 'Job has finished!', buttons);
					}
					else if (old.status !== 'error' && updated.status === 'error') {
						this.$utils.error('Job has stopped due to an error.');
					}
				});
			}
		},
		showJobInfo(job) {
			this.refreshJob(job, updatedJob => {
				EventBus.$emit('showModal', 'Job Details', updatedJob.getAll());
			});
		},
		estimateJob(job) {
			job.estimateJob()
				.then(estimate => {
					EventBus.$emit('showModal', 'Job Estimate', estimate);
				})
				.catch(error => this.$utils.exception(this, error, "Sorry, could not load job estimate."));
		},
		editJob(job) {
			// TODO: provide more update options/don't just override the process graph and nothing else
			EventBus.$emit('getProcessGraph', (script) => {
				job.updateJob(script)
					.then(updatedJob => {
						this.$utils.ok(this, "Job successfully updated.");
						this.updateJobData(updatedJob);
					})
					.catch(error => this.$utils.exception(this, error, "Sorry, could not update job."));;
			});
		},
		queueJob(job) {
			job.startJob()
				.then(updatedJob => {
					this.$utils.ok(this, "Job successfully queued.");
					this.updateJobData(updatedJob);
				})
				.catch(error => this.$utils.exception(this, error, "Sorry, could not queue job."));
		},
		cancelJob(job) {
			job.stopJob()
				.then(updatedJob => {
					this.$utils.ok(this, "Job successfully canceled.");
					this.updateJobData(updatedJob);
				})
				.catch(error => this.$utils.exception(this, error, "Sorry, could not cancel job."));
		},
		viewResults(job) {			
			job.listResults().then(info => {
				if(info.links.length == 0) {
					this.$utils.error(this, "No download available.");
					return;
				} else if (info.links.length > 1) {
					this.$utils.info(this, "Job resulted in multiple files, please download them individually.");
					return;
				}

				this.$utils.info(this, 'Data requested. Please wait...');
				// Send requests without authentication (second parameter false), they should be secured by a token in the URL
				this.connection.download(info.links[0].href, false)
					.then(response => EventBus.$emit('showInViewer', response.data, info.links[0].type))
					.catch(error => {
						this.$utils.exception(this, error, "Sorry, can't download results.");
					});
			});
		},
		downloadResults(job) {	
			job.listResults().then(info => {
				if(info.links.length == 0) {
					this.$utils.error(this, "No download available.");
				}
				else {
					// This can be formatted much nicer and more useful...
					var urls = info.links.map(v => v.href);
					EventBus.$emit('showComponentModal', 'Download results' + (info.title ? ' for: ' + info.title : ''), 'List', {
						dataSource: urls,
						actions: []
					});
				}
			});
		},
		subscribeToJob(id) {  // TODO-CF: Upgrade when js-client supports it again
			var params = {job_id: id};
			this.connection.subscribe(
				'openeo.jobs.debug', params,
				(data, info) => {
					console.log("Debugging information for job " + id + ": " + JSON.stringify(data));
				}
			);
			this.connection.subscribe(
				'openeo.jobs.output', params,
				(data, info) => {
					console.log("Output from job " + id + ": " + JSON.stringify(data));
				}
			);
			this.connection.subscribe(
				'openeo.jobs.status', params,
				(data, info) => {
					console.log("Status information for job " + id + ": " + JSON.stringify(data));
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
#JobPanel td.status[data-value="submitted"] {
	color: black;
}
#JobPanel td.status[data-value="running"] {
	color: darkorange;
}
#JobPanel td.status[data-value="queued"] {
	color: darkblue;
}
#JobPanel td.status[data-value="finished"] {
	color: darkgreen;
}
#JobPanel td.status[data-value="canceled"] {
	color: darkgrey;
}
#JobPanel td.status[data-value="error"] {
	color: red;
}
</style>