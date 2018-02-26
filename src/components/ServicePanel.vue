<template>
  <DataTable ref="table" :dataSource="dataSource" :columns="columns" />
</template>

<script>
import EventBus from '../eventbus.js';
import DataTable from './DataTable.vue';

export default {
	name: 'ServicePanel',
	props: ['userId'],
	components: {
		DataTable
	},
	data() {
		return {
			columns: {
				service_id: {
					name: '#'
				},
				service_type: {
					name: 'Type'
				},
				actions: {
					name: 'Actions',
					type: 'actions',
					id: 'service_id'
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
			return users.getServices();
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
