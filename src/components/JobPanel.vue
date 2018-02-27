<template>
	<DataTable ref="table" :dataSource="dataSource" :columns="columns" id="JobPanel">
		<div slot="toolbar" slot-scope="props">
			<button title="Add new job"><i class="fas fa-plus"></i> Add</button>
		</div>
		<div slot="actions" slot-scope="props">
			<button title="Details"><i class="fas fa-info"></i></button>
			<button title="Edit"><i class="fas fa-edit"></i></button>
			<button title="Start as batch job"><i class="fas fa-play-circle"></i></button>
			<button title="Pause batch job"><i class="fas fa-pause-circle"></i></button>
			<button title="Disable"><i class="fas fa-stop-circle"></i></button>
			<button title="Create Service"><i class="fas fa-plus"></i> <i class="fas fa-map"></i></button>
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
					name: 'ID'
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
	},
	watch: { 
		userId(newVal, oldVal) {
			this.updateData();
		}
	},
	methods: {
		dataSource() {
			let users = OpenEO.Users.getObject(this.userId);
			return users.getJobs();
		},
		updateData() {
			if (typeof this.userId !== 'string' && typeof this.userId !== 'number') {
				this.$refs.table.setNoData(401);
				return;
			}
			this.$refs.table.retrieveData();
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