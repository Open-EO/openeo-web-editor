<template>
  <DataTable ref="table" :dataSource="dataSource" :columns="columns" />
</template>

<script>
import EventBus from '../eventbus.js';
import DataTable from './DataTable.vue';

export default {
  	name: 'FilePanel',
	props: ['userId'],
	components: {
		DataTable
	},
	data() {
		return {
			columns: {
				name: {
					name: 'Path / Name'
				},
				size: {
					name: 'Size'
				},
				modified: {
					name: 'Last modified',
					type: 'datetime'
				},
				actions: {
					name: 'Actions',
					type: 'actions',
					id: 'name'
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
			return users.getFiles();
		},
		updateData() {
			if (typeof this.userId !== 'string' && typeof this.userId !== 'number') {
				this.$refs.table.setNoData(401);
				return;
			}
			this.$refs.table.retrieveData();
		},
		sizeFormatter(value, rowProperties) {
			var i = value == 0 ? 0 : Math.floor( Math.log(value) / Math.log(1024) );
			return ( value / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
		}
	}
}
</script>
