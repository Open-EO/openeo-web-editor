<template>
	<DataTable ref="table" :dataSource="listProcessGraphs" :columns="columns" id="ProcessGraphPanel">
		<template slot="toolbar">
			<button title="Add new process graph" @click="addGraph" v-show="supports('createProcessGraph')"><i class="fas fa-plus"></i> Add</button>
			<button title="Refresh process graphs" @click="updateData()"><i class="fas fa-sync-alt"></i></button> <!-- ToDo: Should be done automatically later -->
		</template>
		<template slot="actions" slot-scope="p">
			<button title="Details" @click="graphInfo(p.row)" v-show="supports('describeProcessGraph')"><i class="fas fa-info"></i></button>
			<button title="Edit" @click="editGraph(p.row)" v-show="supports('updateProcessGraph')"><i class="fas fa-edit"></i></button>
			<button title="Delete" @click="deleteGraph(p.row)" v-show="supports('deleteProcessGraph')"><i class="fas fa-trash"></i></button>
		</template>
	</DataTable>
</template>

<script>
import EventBus from '../eventbus.js';
import WorkPanelMixin from './WorkPanelMixin.vue';

export default {
	name: 'ProcessGraphPanel',
	mixins: [WorkPanelMixin],
	data() {
		return {
			columns: {
				title: {
					name: 'Title'
				},
				processGraphId: {
					name: 'ID',
					primaryKey: true
				},
				actions: {
					name: 'Actions',
					filterable: false
				}
			}
		};
	},
	methods: {
		listProcessGraphs() {
			return this.connection.listProcessGraphs();
		},
		updateData() {
			this.updateTable(this.$refs.table, 'listProcessGraphs', 'createProcessGraph');
		},
		addGraph() {
			EventBus.$emit('getProcessGraph', (script) => {
				this.connection.createProcessGraph(script)
					.then(data => {
						this.$refs.table.addData(data);
						this.$utils.ok(this, 'Process Graph stored at back-end!');
					}).catch(error => this.$utils.exception(this, error, 'Sorry, could not save the process graph.'));
			});
		},
		graphInfo(pg) {
			pg.describeProcessGraph()
				.then(updatedPg => {
					EventBus.$emit('showModal', 'Process Graph Details', updatedPg.getAll());
					this.updateProcessGraphData(updatedPg);
				})
				.catch(error => this.$utils.exception(this, error, 'Sorry, could not load process graph.'));
		},
		editGraph(pg) {
			// TODO: provide more update options/don't just override the process graph and nothing else
			EventBus.$emit('getProcessGraph', (script) => {
				var dataToUpdate= {
					process_graph: script
				};
				pg.updateProcessGraph(dataToUpdate)
					.then(updatedPg => {
						this.$utils.ok(this, 'Process Graph updated!');
						this.updateProcessGraphData(updatedPg);
					}).catch(error => this.$utils.exception(this, error, 'Sorry, could not update the process graph.'));
			});
		},
		deleteGraph(pg) {
			pg.deleteProcessGraph()
				.then(() => {
					this.$refs.table.removeData(pg.processGraphId);
				})
				.catch(error => this.$utils.exception(this, error, 'Sorry, could not delete process graph.'));
		},
		updateProcessGraphData(updatePg) {
			this.$refs.table.replaceData(updatePg);
		}
	}
}
</script>