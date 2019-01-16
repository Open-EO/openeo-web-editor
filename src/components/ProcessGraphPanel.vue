<template>
	<DataTable ref="table" :dataSource="dataSource" :preprocessor="dataPreprocessor" :columns="columns" id="ProcessGraphPanel">
		<template slot="toolbar">
			<button title="Add new process graph" @click="addGraph" v-show="openEO.Capabilities.createUserProcessGraph()"><i class="fas fa-plus"></i> Add</button>
			<button title="Refresh process graphs" @click="updateData()"><i class="fas fa-sync-alt"></i></button> <!-- ToDo: Should be done automatically later -->
		</template>
		<template slot="actions" slot-scope="p">
			<button title="Details" @click="graphInfo(p.row[p.col.id])" v-show="openEO.Capabilities.userProcessGraphInfo()"><i class="fas fa-info"></i></button>
			<button title="Edit" @click="editGraph(p.row[p.col.id])" v-show="openEO.Capabilities.updateUserProcessGraph()"><i class="fas fa-edit"></i></button>
			<button title="Delete" @click="deleteGraph(p.row[p.col.id])" v-show="openEO.Capabilities.deleteUserProcessGraph()"><i class="fas fa-trash"></i></button>
		</template>
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
				id: {
					name: 'ID',
					primaryKey: true
				},
				actions: {
					name: 'Actions',
					id: 'id',
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
		dataPreprocessor(data) {
			return { id: data };
		},
		updateData() {
			if (!this.$refs.table || !this.openEO.Capabilities.userProcessGraphs()) {
				return;
			}
			else if (typeof this.userId !== 'string' && typeof this.userId !== 'number') {
				this.$refs.table.setNoData(401);  // "please authenticate"
			}
			else {
				this.$refs.table.retrieveData();
			}
		},
		addGraph() {
			EventBus.$emit('getProcessGraph', (script) => {
				var userApi = this.openEO.Users.getObject(this.userId);
				userApi.createProcessGraph(script)
					.then(data => {
						this.$refs.table.addData(data.process_graph_id);
						this.$utils.ok(this, 'Process Graph saved!');
					}).catch(error => {
						console.log(error);
						this.$utils.error(this, 'Sorry, could not create a process graph.');
					});
			});
		},
		graphInfo(id) {
			var pgApi = this.openEO.Users.getObject(this.userId).getProcessGraphObject(id);
			pgApi.get()
				.then(data => {
					EventBus.$emit('showModal', 'Process Graph: ' + id, data);
				})
				.catch(error => this.$utils.error(this, 'Sorry, could not load process graph.'));
		},
		editGraph(id) {
			EventBus.$emit('getProcessGraph', (script) => {
				var pgApi = this.openEO.Users.getObject(this.userId).getProcessGraphObject(id);
				pgApi.replace(script)
					.then(data => {
						this.$utils.ok(this, 'Process Graph updated!');
					}).catch(error => {
						this.$utils.error(this, 'Sorry, could not update the process graph.');
					});
			});
		},
		deleteGraph(id) {
			var pgApi = this.openEO.Users.getObject(this.userId).getProcessGraphObject(id);
			pgApi.delete()
				.then(data => {
					this.$refs.table.removeData(id);
				})
				.catch(error => {
					this.$utils.error(this, 'Sorry, could not delete process graph.');
				});
		}
	}
}
</script>

<style>
#ProcessGraphPanel th {
	width: 50%;
}
</style>