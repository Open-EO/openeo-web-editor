<template>
	<DataTable ref="table" :dataSource="dataSource" :columns="columns" id="ProcessGraphPanel">
		<div slot="toolbar" slot-scope="p">
			<button title="Add new process graph" @click="addGraph" v-show="openEO.Capabilities.createUserProcessGraph()"><i class="fas fa-plus"></i> Add</button>
		</div>
		<div slot="actions" slot-scope="p">
			<button title="Details" @click="graphInfo(p.row[p.col.id])" v-show="openEO.Capabilities.userProcessGraphInfo()"><i class="fas fa-info"></i></button>
			<button title="Edit" @click="editGraph(p.row[p.col.id])" v-show="openEO.Capabilities.updateUserProcessGraph()"><i class="fas fa-edit"></i></button>
			<button title="Delete" @click="deleteGraph(p.row[p.col.id])" v-show="openEO.Capabilities.deleteUserProcessGraph()"><i class="fas fa-trash"></i></button>
		</div>
	</DataTable>
</template>

<script>
import EventBus from '../eventbus.js';
import DataTable from './DataTable.vue';

export default {
	name: 'ProcessGraphPanel',
	props: ['openEO','userId'],
	components: {
		DataTable
	},
	data() {
		return {
			columns: {
				$: {
					name: 'ID',
					primaryKey: true
				},
				actions: {
					name: 'Actions',
					id: '$',
					filterable: false
				}
			}
		};
	},
	created() {
		EventBus.$on('serverChanged', this.updateData);
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
			return users.getProcessGraphs();
		},
		updateData() {
			if (!this.openEO.Capabilities.userProcessGraphs()) {
				return;
			}
			else if (typeof this.userId !== 'string' && typeof this.userId !== 'number') {
				this.$refs.table.setNoData(401);
				return;
			}
			this.$refs.table.retrieveData();
		},
		addGraph() {
			EventBus.$emit('evalScript', (script) => {
				var userApi = this.openEO.Users.getObject(this.userId);
				userApi.createProcessGraph(script.ProcessGraph);
			});
		},
		graphInfo(id) {
			try {
				var pgApi = this.openEO.Users.getObject(this.userId).getProcessGraphObject(id);
				pgApi.get();
			} catch(e) {
				this.$utils.error(this, e.message);
			}
		},
		editGraph(id) {
			EventBus.$emit('evalScript', (script) => {
				var pgApi = this.openEO.Users.getObject(this.userId).getProcessGraphObject(id);
				pgApi.replace(script.ProcessGraph);
			});
		},
		deleteGraph(id) {
			try {
				var pgApi = this.openEO.Users.getObject(this.userId).getProcessGraphObject(id);
				pgApi.delete()
					.then(data => {
						this.$refs.table.removeData(id);
					})
					.catch(errorCode => {
						// ToDo
					});
			} catch(e) {
				this.$utils.error(this, e.message);
			}
		}
	}
}
</script>

<style>
#ProcessGraphPanel td {
	width: 50%;
}
</style>