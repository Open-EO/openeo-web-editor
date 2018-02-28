<template>
	<DataTable ref="table" :dataSource="dataSource" :columns="columns" id="JobPanel">
		<div slot="toolbar" slot-scope="p">
			<button title="Add new job" @click="addJob(p.row[p.col.id])"><i class="fas fa-plus"></i> Add</button>
		</div>
		<div slot="actions" slot-scope="p">
			<button title="Details" @click="showJobInfo(p.row[p.col.id])"><i class="fas fa-info"></i></button>
			<button title="Edit" @click="editJob(p.row[p.col.id])"><i class="fas fa-edit"></i></button>
			<button title="Queue as batch job" @click="queueJob(p.row[p.col.id])"><i class="fas fa-play-circle"></i></button>
			<button title="Pause batch job" @click="pauseJob(p.row[p.col.id])"><i class="fas fa-pause-circle"></i></button>
			<button title="Disable" @click="cancelJob(p.row[p.col.id])"><i class="fas fa-stop-circle"></i></button>
			<button title="Download" @click="downloadJob(p.row[p.col.id])"><i class="fas fa-download"></i></button>
			<button title="Create Service" @click="createServiceFromJob(p.row[p.col.id])"><i class="fas fa-plus"></i> <i class="fas fa-map"></i></button>
		</div>
	</DataTable>
</template>

<script>
import EventBus from '../eventbus.js';
import DataTable from './DataTable.vue';

export default {
	name: 'JobPanel',
	props: ['userId'],
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
					format: 'Actions',
					filterable: false,
					id: 'job_id'
				}
			}
		};
	},
	mounted() {
		this.updateData();
		EventBus.$on('jobCreated', this.jobCreated);
		EventBus.$on('serverChanged', this.updateData);
	},
	watch: { 
		userId(newVal, oldVal) {
			this.updateData();
		}
	},
	methods: {
		dataSource() {
			let users = this.$OpenEO.Users.getObject(this.userId);
			return users.getJobs();
		},
		updateData() {
			if (typeof this.userId !== 'string' && typeof this.userId !== 'number') {
				this.$refs.table.setNoData(401);
				return;
			}
			this.$refs.table.retrieveData();
		},
		jobCreated(data) {
			this.$snotify.confirm('Stored with job ID: ' + data.job_id, 'Job created!', {
				timeout: 20000,
				showProgressBar: true,
				closeOnClick: false,
				pauseOnHover: true,
				buttons: [
					{text: 'Download', action: () => this.downloadJob(data.job_id)}
				]
			});
		},
		addJob(id) {
			EventBus.$emit('evalScript', (script) => {
				 this.$OpenEO.Jobs.create(script.ProcessGraph, {});
			} , false);
		},
		showJobInfo(id) {
			try {
				var jobApi = this.$OpenEO.Jobs.getObject(id);
				jobApi.get();
			} catch (e) {
				this.$utils.error(this, e.message);
			}
		},
		editJob(id) {
			EventBus.$emit('evalScript', (script) => {
				var jobApi = this.$OpenEO.Jobs.getObject(id);
				jobApi.modify(script.ProcessGraph, {});
			} , false);
			
		},
		queueJob(id) {
			try {
				var jobApi = this.$OpenEO.Jobs.getObject(id);
				jobApi.queue();
			} catch (e) {
				this.$utils.error(this, e.message);
			}
		},
		pauseJob(id) {
			try {
				var jobApi = this.$OpenEO.Jobs.getObject(id);
				jobApi.pause();
			} catch (e) {
				this.$utils.error(this, e.message);
			}
		},
		cancelJob(id) {
			try {
				var jobApi = this.$OpenEO.Jobs.getObject(id);
				jobApi.cancel();
			} catch (e) {
				this.$utils.error(this, e.message);
			}
		},
		downloadJob(id) {
			var format = prompt('Please specify the file format you need or leave empty for default format.', '');
			try {
				this.$utils.info(this, 'Download requested. Please wait...');
				var jobApi = this.$OpenEO.Jobs.getObject(id);
				jobApi.download(format).then(data => {
					var ext = '';
					if (format) {
						ext = "." + format;
					}
					this.$utils.downloadData(data, id + ext);
				});
			} catch (e) {
				this.$utils.error(this, e.message);
			}
		},
		createServiceFromJob(id) {
			// ToDo: Request what user wants to add
			try {
				this.$OpenEO.Services.create(id, null, {});
			} catch (e) {
				this.$utils.error(this, e.message);
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