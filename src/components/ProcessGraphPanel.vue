<template>
  <DataTable ref="table" :dataSource="dataSource" :columns="columns" />
</template>

<script>
import EventBus from '../eventbus.js';
import DataTable from './DataTable.vue';

export default {
	name: 'ProcessGraphPanel',
	props: ['userId'],
	components: {
		DataTable
	},
	data() {
		return {
			columns: {
				$: {
					name: 'Process graph'
				},
				actions: {
					name: 'Actions',
					type: 'actions',
					id: '$'
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
			return users.getProcessGraphs();
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