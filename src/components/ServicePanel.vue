<template>
	<DataTable ref="table" :dataSource="dataSource" :columns="columns" id="ServicePanel">
		<div slot="toolbar" slot-scope="props">
			<button title="Add new service"><i class="fas fa-plus"></i> Add</button>
		</div>
		<div slot="actions" slot-scope="props">
			<button title="Details"><i class="fas fa-info"></i></button>
			<button title="Edit"><i class="fas fa-edit"></i></button>
			<button title="Delete"><i class="fas fa-trash"></i></button>
		</div>
	</DataTable>
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
					name: 'ID'
				},
				service_type: {
					name: 'Type'
				},
				actions: {
					name: 'Actions',
					format: 'Actions',
					filterable: false,
					id: 'service_id'
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

<style>
#ServicePanel .service_id {
	width: 30%;
}
#ServicePanel .service_type {
	width: 20%;
}
</style>