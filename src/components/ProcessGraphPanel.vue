<template>
	<DataTable ref="table" :dataSource="listProcessGraphs" :columns="columns" id="ProcessGraphPanel">
		<template slot="toolbar">
			<button title="Add new process graph" @click="addGraphFromScript" v-show="supports('createProcessGraph')"><i class="fas fa-plus"></i> Add</button>
			<button title="Refresh process graphs" @click="updateData()"><i class="fas fa-sync-alt"></i></button> <!-- ToDo: Should be done automatically later -->
		</template>
		<template slot="actions" slot-scope="p">
			<button title="Details" @click="graphInfo(p.row)" v-show="supports('describeProcessGraph')"><i class="fas fa-info"></i></button>		<button title="Show in Editor" @click="showInEditor(p.row)" v-show="supports('describeProcessGraph')"><i class="fas fa-code-branch"></i></button>
			<button title="Edit metadata" @click="editMetadata(p.row)" v-show="supports('updateProcessGraph')"><i class="fas fa-edit"></i></button>
			<button title="Replace process graph" @click="replaceProcessGraph(p.row)" v-show="supports('updateProcessGraph')"><i class="fas fa-retweet"></i></button>
			<button title="Delete" @click="deleteGraph(p.row)" v-show="supports('deleteProcessGraph')"><i class="fas fa-trash"></i></button>
		</template>
	</DataTable>
</template>

<script>
import EventBus from '../eventbus.js';
import WorkPanelMixin from './WorkPanelMixin.vue';
import Utils from '../utils.js';
import Field from './blocks/field';

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
		getTitleField() {
			return new Field('title', 'Title', {type: 'string'});
		},
		getDescriptionField() {
			return new Field('description', 'Description', {type: 'string', format: 'commonmark'}, 'CommonMark (Markdown) is allowed.');
		},
		addGraphFromScript() {
			EventBus.$emit('getProcessGraph', script => {
				var fields = [
					this.getTitleField(),
					this.getDescriptionField()
				];
				EventBus.$emit('showDataForm', "Store a new process graph", fields, data => this.addGraph(script, data));
			});
		},
		addGraph(script, data) {
			if (typeof data.title !== 'string' || data.title.length === 0) {
				data.title = null;
			}
			if (typeof data.description !== 'string' || data.description.length === 0) {
				data.description = null;
			}
			this.connection.createProcessGraph(script, data.title, data.description)
				.then(data => {
					this.$refs.table.addData(data);
					Utils.ok(this, 'Process Graph stored at back-end!');
				}).catch(error => Utils.exception(this, error, 'Sorry, could not save the process graph.'));
		},
		graphInfo(pg) {
			this.refreshProcessGraph(pg, updatedPg => {
				EventBus.$emit('showProcessGraphInfo', updatedPg.getAll());
			});
		},
		editMetadata(oldPg) {
			this.refreshProcessGraph(oldPg, pg => {
				var fields = [
					this.getTitleField().setValue(pg.title),
					this.getDescriptionField().setValue(pg.description)
				];
				EventBus.$emit('showDataForm', "Edit metadata for process graph #" + pg.id, fields, data => this.updateMetadata(pg, data));
			});
		},
		replaceProcessGraph(pg) {
			EventBus.$emit('getProcessGraph', script => this.updateMetadata(pg, {processGraph: script}));
		},
		updateTitle(pg, newTitle) {
			this.updateMetadata(pg, {title: newTitle});
		},
		updateMetadata(pg, data) {
			pg.updateProcessGraph(data)
				.then(updatePg => {
					Utils.ok(this, "Process graph successfully updated.");
					this.updateProcessGraphData(updatePg);
				})
				.catch(error => Utils.exception(this, error, "Sorry, could not update process graph."));
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