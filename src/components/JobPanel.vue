<template>
	<DataTable ref="table" :dataSource="listJobs" :preprocessor="dataPreprocessor" :columns="columns" id="JobPanel" v-if="connection && capabilities">
		<template slot="toolbar" slot-scope="p">
			<button title="Add new job" @click="createJobFromScript" v-show="capabilities.hasFeature('createJob')"><i class="fas fa-plus"></i> Add</button>
			<button title="Refresh jobs" @click="updateData()" v-show="capabilities.hasFeature('listJobs')"><i class="fas fa-sync-alt"></i></button> <!-- ToDo: Should be done automatically later -->
		</template>
		<template slot="actions" slot-scope="p">
			<button title="Details" @click="showJobInfo(p.row)" v-show="capabilities.hasFeature('describeJob')"><i class="fas fa-info"></i></button>
			<button title="Edit" @click="editJob(p.row)" v-show="capabilities.hasFeature('updateJob')"><i class="fas fa-edit"></i></button>
			<button title="Start" @click="queueJob(p.row)" v-show="capabilities.hasFeature('startJob')"><i class="fas fa-play-circle"></i></button>
			<button title="Cancel" @click="cancelJob(p.row)" v-show="capabilities.hasFeature('stopJob')"><i class="fas fa-stop-circle"></i></button>
			<button title="Download" @click="downloadJob(p.row)" v-show="capabilities.hasFeature('downloadResults')"><i class="fas fa-download"></i></button>
			<button title="View results" @click="downloadJob(p.row, true)" v-show="capabilities.hasFeature('downloadResults')"><i class="fas fa-eye"></i></button>
			<button title="Create Service" @click="createServiceFromJob(p.row)" v-show="capabilities.hasFeature('createService')"><i class="fas fa-plus"></i> <i class="fas fa-cloud"></i></button>
			<!-- TODO-CF: Subscriptions are not in the client dev guidelines yet - check what format will be agreed on -->
			<button title="Subscribe" @click="subscribeToJob(p.row)" v-show="capabilities.hasFeature('subscribe') && !jobSubscriptions.includes(p.row)"><i class="fas fa-bell"></i></button>
			<button title="Unsubscribe" @click="unsubscribeFromJob(p.row)" v-show="capabilities.hasFeature('unsubscribe') && jobSubscriptions.includes(p.row)"><i class="fas fa-bell-slash"></i></button>
		</template>
	</DataTable>
</template>

<script>
import EventBus from '../eventbus.js';
import DataTable from './DataTable.vue';

export default {
	name: 'JobPanel',
	props: ['connection', 'capabilities', 'supportedServices'],
	components: {
		DataTable
	},
	data() {
		return {
			columns: {
				jobId: {
					name: 'ID',
					primaryKey: true,
					hide: true
				},
				title: {
					name: 'Title'
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
				costs: {
					name: 'Costs',
					filterable: false
				},
				actions: {
					name: 'Actions',
					filterable: false,
					id: 'job_id'
				}
			},
			jobSubscriptions: [],
			// Watchers are available until the job subscription works
			// ToDo: Afterwards everything related to this property can be removed.
			watchers: []
		};
	},
	computed: {
		userId: {
			get() {
				return this.connection ? this.connection.getUserId() : undefined;
			}
		}
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
		listJobs() {
			return this.connection.listJobs();
		},
		dataPreprocessor(data, index) {
			if (!data.title) {
				data.title = "Job #" + data.jobId.toUpperCase().substr(-6);
			}
			return data;
		},
		updateData() {
			if (!this.$refs.table) {
				return;
			}
			else if (!this.capabilities.hasFeature('createJob')) {
				this.$refs.table.setNoData(501);  // "feature not supported"
			}
			else if (!this.capabilities.hasFeature('listJobs')) {
				this.$refs.table.setNoData('Feature supported, but retrieval of stored data of this feature not supported.');
			}
			else if (typeof this.userId !== 'string' && typeof this.userId !== 'number') {
				this.$refs.table.setNoData(401);  // "please authenticate"
			}
			else {
				this.$refs.table.retrieveData();
			}
		},
		jobCreated(job) {
			if (!this.$refs.table) {
				return;
			}

			this.$refs.table.addData(job);

			var options = {
				buttons: []
			};
			if (this.capabilities.hasFeature('downloadResults')) {
				options.buttons.push({text: 'Download', action: () => this.downloadJob(job)});
			}
			this.$snotify.confirm('Job created!', null, options);
		},
		createJob(processGraph, outputFormat) {
			this.connection.createJob(processGraph, outputFormat)
				.then(job => {
					EventBus.$emit('jobCreated', job);
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
			EventBus.$emit('getProcessGraph', (script) => {
				this.createJob(script.ProcessGraph, format);
			});
		},
		updateJobDataFromServer(outdatedJob) {
			outdatedJob.describeJob().then(data => this.updateJobData(data));
		},
		updateJobData(uptodateJob) {
			this.$refs.table.replaceData(uptodateJob);

			// Watchers
			var index = this.watchers.findIndex(j => j.jobId == uptodateJob.jobId);
			switch(data.status.toLowerCase()) {
				case 'running':
				case 'queued':
				case 'unknown':
					if (index === -1) {
						this.watchers.push(uptodateJob);
					}
					break;
				default:
					delete this.watchers[index];
			}
		},
		executeWatchers() {
			for(var i in this.watchers) {
				this.updateJobDataFromServer(this.watchers[i]);
			}
		},
		showJobInfo(job) {
			job.describeJob()
				.then(data => {
					EventBus.$emit('showModal', 'Job: ' + data.job_id, data);
					this.updateJobData(job);
				})
				.catch(error => this.$utils.error(this, 'Sorry, could not load job details.'));
		},
		editJob(job) {
			// TODO-CF: provide more update options/don't just override the process graph and nothing else
			EventBus.$emit('getProcessGraph', (script) => {
				job.updateJob(script.ProcessGraph);
				this.updateJobDataFromServer(job);
			} , false);
		},
		queueJob(id) {
			job.startJob()
				.then(wasSuccessful => {
					if (!wasSucessful) {  // switch to error handler below
						throw 'Error while queueing job';
						return;
					}
					this.$utils.ok(this, "Job successfully queued.");
					this.updateJobDataFromServer(id);
				})
				.catch(error => this.$utils.error(this, "Sorry, could not queue job."));
		},
		cancelJob(job) {
			job.stopJob()
				.then(wasSuccessful => {
					if (!wasSucessful) {  // switch to error handler below
						throw 'Error while canceling job';
						return;
					}
					this.$utils.ok(this, "Job successfully canceled.");
					this.updateJobDataFromServer(id);
				})
				.catch(error => this.$utils.error(this, "Sorry, could not cancel job."));
		},
		downloadJob(job, view = false) {
			var format = prompt('Please specify the file format you need or leave empty for default format.', '');
			if (format === null) {
				return;
			}
			
			job.listResults().then(info => {
				var url;
				if(info.links.length == 0) {
					this.$utils.error(this, "No download available.");
				} else if(info.links.length == 1) {
					url = info.links[0].href;
				} else {
					// TODO-CF: Use selection UI in Modal instead of quick'n'dirty prompt
					url = prompt("Please specify which URL should be downloaded by typing its numer:\n" + info.links.map((value, index) => '['+index+'] '+value).join("\n"), '1');
				}
				var filename = this.$utils.getFileNameFromURL(url);

				this.$utils.info(this, (view ? 'Data' : 'Download') + ' requested. Please wait...');

				if(!view) {
					this.$utils.downloadData(url, filename, undefined, true);
				} else {
					this.connection.download(url)
						.then(blob => {
							// TODO-CF: Matthias says the hacky download should be replaced (e.g. with list of URLs)
							this.$utils.blobToText(blob, (event) => {
								// View in browser
								EventBus.$emit('getProcessGraph', (script) => {
									EventBus.$emit('showInViewer', blob, script);
								});
							});
						})
						.catch(error => {
							this.$utils.error(this, "Sorry, an error occured.");
						});
				}
			});
		},
		createServiceFromJob(job) {
			var type;
			if (this.supportedServices.length == 1) {
				type = Object.keys(this.supportedServices)[0];
			}
			else {
				var type = prompt('Please specify the service type you want to create:', '');
				if (type === null) {
					return;
				}
				else if (Object.keys(this.supportedServices).indexOf(type) === -1) {
					this.$utils.error(this, 'Invalid service type specified.');
				}
			}
			
			// ToDo: Ask user for service arguments

			// the Job object may not contain the process graph, so better request it freshly from the server
			job.describeJob()
				.then(jobInfo => {
					this.connection.createService(jobInfo.process_graph, type)
						.then(service => {
							EventBus.$emit('serviceCreated', service);
						}).catch(error => {
							this.$utils.error(this, "An error occured while creating the service.");
						})
					})
				.catch(error => {
					this.$utils.error(this, "An error occured while fetching the job's process graph.");
				});
		},
		subscribeToJob(id) {  // TODO-CF: Upgrade when js-client supports it again
			this.openEO.API.subscribe(
				'openeo.jobs.debug',
				{
					job_id: id
				},
				(data, info) => {
					console.log("Debugging information for job " + id + ": " + JSON.stringify(data));
				}
			);
			this.jobSubscriptions.push(id);
		},
		unsubscribeFromJob(id) {  // TODO-CF: Upgrade when js-client supports it again
			this.openEO.API.unsubscribe(
				'openeo.jobs.debug',
				{
					job_id: id
				}
			);
			this.jobSubscriptions.splice(this.jobSubscriptions.indexOf(id), 1);
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