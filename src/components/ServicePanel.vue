<template>
	<DataTable ref="table" :dataSource="dataSource" :columns="columns" id="ServicePanel">
		<div slot="toolbar" slot-scope="p">
			<button title="Add new service" @click="addService"><i class="fas fa-plus"></i> Add</button>
		</div>
		<div slot="actions" slot-scope="p">
			<button title="Details" @click="serviceInfo(p.row[p.col.id])"><i class="fas fa-info"></i></button>
			<button title="Edit" @click="editService(p.row[p.col.id])"><i class="fas fa-edit"></i></button>
			<button title="Delete" @click="deleteService(p.row[p.col.id])"><i class="fas fa-trash"></i></button>
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
					name: 'ID',
					primaryKey: true
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
			return users.getServices();
		},
		updateData() {
			if (typeof this.userId !== 'string' && typeof this.userId !== 'number') {
				this.$refs.table.setNoData(401);
				return;
			}
			this.$refs.table.retrieveData();
		},
		addService() {
			// ToDo: Request what user wants to add
			try {
				this.$OpenEO.Services.create(null, null, {});
			} catch (e) {
				this.$utils.error(this, e.message);
			}
		},
		serviceInfo(id) {
			try {
				var serviceApi = this.$OpenEO.Services.getObject(id);
				serviceApi.get();
			} catch (e) {
				this.$utils.error(this, e.message);
			}
		},
		editService(id) {
			// ToDo: Request what user wants to change
			try {
				var serviceApi = this.$OpenEO.Services.getObject(id);
				serviceApi.modify(null, null, {});
			} catch (e) {
				this.$utils.error(this, e.message);
			}
		},
		deleteService(id) {
			try {
				var serviceApi = this.$OpenEO.Services.getObject(id);
				serviceApi.delete()
					.then(data => {
						this.$refs.table.removeData(id);
					})
					.catch(errorCode => {
						// ToDo
					});
			} catch (e) {
				this.$utils.error(this, e.message);
			}
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