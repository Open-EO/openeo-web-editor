<template>
	<DataTable ref="table" :dataSource="listProcessGraphs" :columns="columns" id="ProcessGraphPanel">
		<template slot="toolbar">
			<button title="Add new process graph" @click="addGraph" v-show="supports('createProcessGraph')"><i class="fas fa-plus"></i> Add</button>
			<button title="Refresh process graphs" @click="updateData()"><i class="fas fa-sync-alt"></i></button> <!-- ToDo: Should be done automatically later -->
		</template>
		<template slot="actions" slot-scope="p">
			<button title="Details" @click="graphInfo(p.row)" v-show="supports('describeProcessGraph')"><i class="fas fa-info"></i></button>		<button title="Show in Editor" @click="showInEditor(p.row)" v-show="supports('describeProcessGraph')"><i class="fas fa-code-branch"></i></button>
			<button title="Update process graph" @click="updateProcessGraph(p.row)" v-show="supports('updateProcessGraph')"><i class="fas fa-edit"></i></button>
			<button title="Delete" @click="deleteGraph(p.row)" v-show="supports('deleteProcessGraph')"><i class="fas fa-trash"></i></button>
		</template>
	</DataTable>
</template>

<script>
import EventBus from '../eventbus.js';
import WorkPanelMixin from './WorkPanelMixin.vue';
import Utils from '../utils.js';

export default {
	name: 'ProcessGraphPanel',
	mixins: [WorkPanelMixin],
	data() {
		return {
			columns: {
				processGraphId: {
					name: 'ID',
					primaryKey: true,
					hide: true
				},
				title: {
					name: 'Title',
					edit: this.updateTitle
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
		refreshProcessGraph(pg, callback = null) {
			pg.describeProcessGraph()
				.then(updatedPg => {
					if (typeof callback === 'function') {
						callback(updatedPg);
					}
					this.updateProcessGraphData(updatedPg);
				})
				.catch(error => Utils.exception(this, error, 'Sorry, could not load process graph.'));
		},
		showInEditor(pg) {
			this.refreshProcessGraph(pg, updatedPg => {
				EventBus.$emit('insertProcessGraph', updatedPg.processGraph);
			});
		},
		addGraph() {
			var title = prompt("Please specify a title for the process graph:");
			if (title === null) {
				return;
			}
			else if (typeof title !== 'string' || title.length === 0) {
				title = null;
			}

			EventBus.$emit('getProcessGraph', script => {
				this.connection.createProcessGraph(script, title)
					.then(data => {
						this.$refs.table.addData(data);
						Utils.ok(this, 'Process Graph stored at back-end!');
					}).catch(error => Utils.exception(this, error, 'Sorry, could not save the process graph.'));
			});
		},
		graphInfo(pg) {
			this.refreshProcessGraph(pg, updatedPg => {
				EventBus.$emit('showProcessGraphInfo', updatedPg.getAll());
			});
		},
		updateProcessGraph(pg) {
			EventBus.$emit('getProcessGraph', script => {
				pg.updateProcessGraph({processGraph: script})
					.then(updatedPg => {
						Utils.ok(this, 'Process Graph updated!');
						this.updateProcessGraphData(updatedPg);
					}).catch(error => Utils.exception(this, error, 'Sorry, could not update the process graph.'));
			});
		},
		updateTitle(pg, newTitle) {
			pg.updateProcessGraph({title: newTitle})
				.then(updatePg => {
					Utils.ok(this, "Process graph title successfully updated.");
					this.updateProcessGraphData(updatePg);
				})
				.catch(error => Utils.exception(this, error, "Sorry, could not update process graph title."));
		},
		deleteGraph(pg) {
			pg.deleteProcessGraph()
				.then(() => {
					this.$refs.table.removeData(pg.processGraphId);
				})
				.catch(error => Utils.exception(this, error, 'Sorry, could not delete process graph.'));
		},
		updateProcessGraphData(updatePg) {
			this.$refs.table.replaceData(updatePg);
		}
	}
}
</script>