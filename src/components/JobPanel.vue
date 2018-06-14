<template>
	<DataTable ref="table" :dataSource="dataSource" :columns="columns" id="JobPanel">
		<template slot="toolbar" slot-scope="p">
			<button title="Add new job" @click="createJobFromScript" v-show="openEO.Capabilities.createJob()"><i class="fas fa-plus"></i> Add</button>
			<button title="Refresh jobs" @click="updateData()" v-show="openEO.Capabilities.userJobs()"><i class="fas fa-sync-alt"></i></button> <!-- ToDo: Should be done automatically later -->
		</template>
		<template slot="actions" slot-scope="p">
			<button title="Details" @click="showJobInfo(p.row[p.col.id])" v-show="openEO.Capabilities.jobInfo()"><i class="fas fa-info"></i></button>
			<button title="Edit" @click="editJob(p.row[p.col.id])" v-show="openEO.Capabilities.updateJob()"><i class="fas fa-edit"></i></button>
			<button title="Queue as batch job" @click="queueJob(p.row[p.col.id])" v-show="openEO.Capabilities.queueJob()"><i class="fas fa-play-circle"></i></button>
			<button title="Pause batch job" @click="pauseJob(p.row[p.col.id])" v-show="openEO.Capabilities.pauseJob()"><i class="fas fa-pause-circle"></i></button>
			<button title="Disable" @click="cancelJob(p.row[p.col.id])" v-show="openEO.Capabilities.cancelJob()"><i class="fas fa-stop-circle"></i></button>
			<button title="Download" @click="downloadJob(p.row[p.col.id])" v-show="openEO.Capabilities.downloadJob()"><i class="fas fa-download"></i></button>
			<button title="View results" @click="downloadJob(p.row[p.col.id], true)" v-show="openEO.Capabilities.downloadJob()"><i class="fas fa-eye"></i></button>
			<button title="Create Service" @click="createServiceFromJob(p.row[p.col.id])" v-show="openEO.Capabilities.createService()"><i class="fas fa-plus"></i> <i class="fas fa-cloud"></i></button>
		</template>
	</DataTable>
</template>

<script>
import EventBus from '../eventbus.js';
import DataTable from './DataTable.vue';

export default {
	name: 'JobPanel',
	props: ['openEO','userId'],
	components: {
		DataTable
	},
	data() {
		return {
			columns: {
				job_id: {
					name: 'ID',
					primaryKey: true
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
				consumed_credits: {
					name: 'Costs',
					filterable: false
				},
				actions: {
					name: 'Actions',
					filterable: false,
					id: 'job_id'
				}
			},
			// Watchers are available until the job subscription works
			// ToDo: Afterwards everything related to this property can be removed.
			watchers: []
		};
	},
	created() {
		EventBus.$on('jobCreated', this.jobCreated);
		EventBus.$on('serverChanged', this.updateData);
	},
	mounted() {
		window.setInterval(this.executeWatchers, 5000);
	},
	watch: { 
		userId(newVal, oldVal) {
			if (newVal !== null) {
				this.updateData();
			}
		}
	},
	methods: {
		dataSource() {
			let users = this.openEO.Users.getObject(this.userId);
			return users.getJobs();
		},
		updateData() {
			if (!this.$refs.table) {
				return;
			}
			else if (!this.openEO.Capabilities.createJob()) {
				this.$refs.table.setNoData(501);  // "feature not supported"
			}
			else if (!this.openEO.Capabilities.userJobs()) {
				this.$refs.table.setNoData('Feature supported, but retrieval of stored data of this feature not supported.');
			}
			else if (typeof this.userId !== 'string' && typeof this.userId !== 'number') {
				this.$refs.table.setNoData(401);  // "please authenticate"
			}
			else {
				this.$refs.table.retrieveData();
			}
		},
		jobCreated(data) {
			if (!this.$refs.table) {
				return;
			}

			this.$refs.table.addData(data);

			var options = {
				buttons: []
			};
			if (this.openEO.Capabilities.downloadJob()) {
				options.buttons.push({text: 'Download', action: () => this.downloadJob(data.job_id)});
			}
			this.$snotify.confirm('Job created!', null, options);
		},
		createJob(job, output) {
			this.openEO.Jobs.create(job.ProcessGraph, output)
				.then(data => {
					EventBus.$emit('jobCreated', data);
				}).catch(error => {
					this.$utils.error(this, 'Sorry, could not create an openEO job.');
				});
		},
		createJobFromScript(id) {
			// Todo: Output formats
			var output = {};
			var format = prompt('Please specify the file format you need or leave empty for default format.', '');
			if (format === null) {
				return;
			}
			EventBus.$emit('evalScript', (script) => {
				this.createJob(script, format);
			});
		},
		updateJobDataById(id) {
			var jobApi = this.openEO.Jobs.getObject(id);
			jobApi.get().then(data => this.updateJobData(data));
		},
		updateJobData(data) {
			this.$refs.table.replaceData(data);

			// Watchers
			var index = this.watchers.indexOf(data.job_id);
			switch(data.status.toLowerCase()) {
				case 'running':
				case 'queued':
				case 'unknown':
					if (index === -1) {
						this.watchers.push(data.job_id);
					}
					break;
				default:
					delete this.watchers[index];
			}
		},
		executeWatchers() {
			for(var i in this.watchers) {
				this.updateJobDataById(this.watchers[i]);
			}
		},
		showJobInfo(id) {
			var jobApi = this.openEO.Jobs.getObject(id);
			jobApi.get()
				.then(data => {
					EventBus.$emit('showModal', 'Job: ' + id, data);
					this.updateJobData(data);
				})
				.catch(error => this.$utils.error(this, 'Sorry, could not load job details.'));
		},
		editJob(id) {
			EventBus.$emit('evalScript', (script) => {
				var jobApi = this.openEO.Jobs.getObject(id);
				jobApi.modify(script.ProcessGraph, {});
				this.updateJobDataById(id);
			} , false);
		},
		queueJob(id) {
			var jobApi = this.openEO.Jobs.getObject(id);
			jobApi.queue()
				.then(data => {
					this.$utils.ok(this, "Job successfully queued.");
					this.updateJobDataById(id);
				})
				.catch(error => this.$utils.error(this, "Sorry, could not queue job."));
		},
		pauseJob(id) {
			var jobApi = this.openEO.Jobs.getObject(id);
			jobApi.pause().then(data => {
					this.$utils.ok(this, "Job successfully paused.");
					this.updateJobDataById(id);
				})
				.catch(error => this.$utils.error(this, "Sorry, could not pause job."));
		},
		cancelJob(id) {
			var jobApi = this.openEO.Jobs.getObject(id);
			jobApi.cancel().then(data => {
					this.$utils.ok(this, "Job successfully canceled.");
					this.updateJobDataById(id);
				})
				.catch(error => this.$utils.error(this, "Sorry, could not cancel job."));
		},
		downloadJob(id, view = false) {
			var format = prompt('Please specify the file format you need or leave empty for default format.', '');
			if (format === null) {
				return;
			}
			this.$utils.info(this, (view ? 'Data' : 'Download') + ' requested. Please wait...');
			var jobApi = this.openEO.Jobs.getObject(id);
			jobApi.download(format).then(blob => {
				// ToDo: For now we support both direct downloading and download URLs (only one for now).
				// Implementation is not very nice and needs improvement, but it's a prototype...
				this.$utils.blobToText(blob, (event) => {
					if (blob.type == 'application/json' || format == 'json') {
						var json = JSON.parse(event.target.result);
						if (Array.isArray(json) && json.length == 1 && typeof json[0] === 'string' && json[0].indexOf('://') !== -1) {
							// Download file
							var filename = this.$utils.getFileNameFromURL(json[0]);
							this.openEO.HTTP.download(json[0])
								.then(blob => this.handleDownloadedData(blob, view, filename))
								.catch(e => this.$utils.error(this, "Sorry, could not send file to browser."));
						}
						else {
							this.handleDownloadedData(blob, view);
						}
					}
					else {
						this.handleDownloadedData(blob, view);
					}
				});
			}).catch(error => {
				this.$utils.error(this, "Sorry, an error occured.");
			});
		},
		handleDownloadedData(blob, view, filename = null) {
			if (view) {
				// View in browser
				EventBus.$emit('evalScript', (script) => {
					EventBus.$emit('showInViewer', blob, script);
				});
			}
			else {
				this.$utils.downloadData(blob, filename, blob.type);
			}
		},
		createServiceFromJob(id) {
			var type;
			if (this.openEO.SupportedServices.length == 1) {
				type = this.openEO.SupportedServices[0];
			}
			else {
				var type = prompt('Please specify the service type you want to create:', '');
				if (type === null) {
					return;
				}
				else if (this.openEO.SupportedServices.indexOf(type.toLowerCase()) === -1) {
					this.$utils.error(this, 'Invalid service type specified.');
				}
			}
			// ToDo: Ask user for service arguments
			this.openEO.Services.create(id, type, {}).then(data => {
				EventBus.$emit('serviceCreated', data);
			}).catch(error => {
				this.$utils.error(this, "Sorry, an error occured.");
			});
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
#JobPanel td.status[data-value="paused"] {
	color: purple;
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
#JobPanel td.status[data-value="unknown"] {
	color: darkgrey;
}
</style>