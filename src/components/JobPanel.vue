<template>
  <DataTable ref="table" :dataSource="dataSource" :columns="columns" />
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
					name: '#'
				},
				status: {
					name: 'Status'
				},
				submitted: {
					name: 'Submitted',
					type: 'datetime'
				},
				updated: {
					name: 'Last update',
					type: 'datetime'
				},
				consumed_credits: {
					name: 'Costs'
				},
				actions: {
					name: 'Actions',
					type: 'actions',
					id: 'job_id'
				}
			}
		};
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
