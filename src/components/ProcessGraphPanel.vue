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
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import WorkPanelMixin from './WorkPanelMixin.vue';
import Utils from '../utils.js';
import Field from './blocks/field';

export default {
	name: 'ProcessGraphPanel',
	mixins: [WorkPanelMixin, EventBusMixin],
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
				.catch(error => Utils.exception(this, error, 'Loading process graph failed'));
		},
		showInEditor(pg) {
			this.refreshProcessGraph(pg, updatedPg => {
				this.emit('insertProcessGraph', updatedPg.processGraph);
			});
		},
		getTitleField() {
			return new Field('title', 'Title', {type: 'string'});
		},
		getDescriptionField() {
			return new Field('description', 'Description', {type: 'string', format: 'commonmark'}, 'CommonMark (Markdown) is allowed.');
		},
		addGraphFromScript() {
			this.emit('getProcessGraph', script => {
				var fields = [
					this.getTitleField(),
					this.getDescriptionField()
				];
				this.emit('showDataForm', "Store a new process graph", fields, data => this.addGraph(script, data));
			});
		},
		normalizeToDefaultData(data) {
			if (typeof data.title !== 'undefined' && (typeof data.title !== 'string' || data.title.length === 0)) {
				data.title = null;
			}
			if (typeof data.description !== 'undefined' && (typeof data.description !== 'string' || data.description.length === 0)) {
				data.description = null;
			}
			return data;
		},
		addGraph(script, data) {
			data = this.normalizeToDefaultData(data);
			this.connection.createProcessGraph(script, data.title, data.description)
				.then(data => {
					this.$refs.table.addData(data);
					Utils.ok(this, 'Process graph successfully stored!');
				}).catch(error => Utils.exception(this, error, 'Storing process graph failed.'));
		},
		graphInfo(pg) {
			this.refreshProcessGraph(pg, updatedPg => {
				this.emit('showProcessGraphInfo', updatedPg.getAll());
			});
		},
		editMetadata(oldPg) {
			this.refreshProcessGraph(oldPg, pg => {
				var fields = [
					this.getTitleField().setValue(pg.title),
					this.getDescriptionField().setValue(pg.description)
				];
				this.emit('showDataForm', "Edit metadata for a process graph", fields, data => this.updateMetadata(pg, data));
			});
		},
		replaceProcessGraph(pg) {
			this.emit('getProcessGraph', script => this.updateMetadata(pg, {processGraph: script}));
		},
		updateTitle(pg, newTitle) {
			this.updateMetadata(pg, {title: newTitle});
		},
		updateMetadata(pg, data) {
			data = this.normalizeToDefaultData(data);
			pg.updateProcessGraph(data)
				.then(updatePg => {
					Utils.ok(this, "Process graph successfully updated.");
					this.updateProcessGraphData(updatePg);
				})
				.catch(error => Utils.exception(this, error, "Updating process graph failed"));
		},
		deleteGraph(pg) {
			pg.deleteProcessGraph()
				.then(() => {
					this.$refs.table.removeData(pg.processGraphId);
				})
				.catch(error => Utils.exception(this, error, 'Deleting process graph failed'));
		},
		updateProcessGraphData(updatePg) {
			this.$refs.table.replaceData(updatePg);
		}
	}
}
</script>