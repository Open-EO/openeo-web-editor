<template>
	<DataTable ref="table" :dataSource="listUserProcesses" :columns="columns" id="CustomProcessPanel">
		<template slot="toolbar">
			<button title="Add new custom process" @click="addProcessFromScript" v-show="supports('setUserProcess')"><i class="fas fa-plus"></i> Add</button>
			<button title="Refresh custom process" v-if="isListDataSupported" @click="updateData()"><i class="fas fa-sync-alt"></i></button> <!-- ToDo: Should be done automatically later -->
		</template>
		<template slot="actions" slot-scope="p">
			<button title="Details" @click="graphInfo(p.row)" v-show="supports('describeUserProcess')"><i class="fas fa-info"></i></button>		<button title="Show in Editor" @click="showInEditor(p.row)" v-show="supports('describeUserProcess')"><i class="fas fa-code-branch"></i></button>
			<!-- ToDo: Align with 1.0, move edit metadata to visual model editor -->
			<button title="Edit metadata" @click="editMetadata(p.row)" v-show="supports('replaceUserProcess')"><i class="fas fa-edit"></i></button>
			<button title="Replace process" @click="replaceProcess(p.row)" v-show="supports('replaceUserProcess')"><i class="fas fa-retweet"></i></button>
			<button title="Delete" @click="deleteProcess(p.row)" v-show="supports('deleteUserProcess')"><i class="fas fa-trash"></i></button>
		</template>
	</DataTable>
</template>

<script>
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import WorkPanelMixin from './WorkPanelMixin.vue';
import Utils from '../utils.js';
import Field from './blocks/field';

export default {
	name: 'CustomProcessPanel',
	mixins: [WorkPanelMixin, EventBusMixin],
	data() {
		return {
			columns: {
				id: {
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
			},
			listFunc: 'listUserProcesses',
			createFunc: 'setUserProcess'
		};
	},
	methods: {
		listUserProcesses() {
			return this.connection.listUserProcesses();
		},
		updateData() {
			this.updateTable(this.$refs.table);
		},
		refreshCustomProcess(process, callback = null) {
			process.describeUserProcess()
				.then(updated => {
					if (typeof callback === 'function') {
						callback(updated);
					}
					this.replaceUserProcessData(updated);
				})
				.catch(error => Utils.exception(this, error, 'Loading custom process failed'));
		},
		showInEditor(process) {
			this.refreshCustomProcess(process, updated => {
				this.emit('insertCustomProcess', updated.process);
			});
		},
		getTitleField() {
			return new Field('title', 'Title', {type: 'string'});
		},
		getDescriptionField() {
			return new Field('description', 'Description', {type: 'string', format: 'commonmark'}, undefined, 'CommonMark (Markdown) is allowed.');
		},
		addProcessFromScript() {
			this.emit('getCustomProcess', script => {
				var fields = [
					this.getTitleField(),
					this.getDescriptionField()
				];
				this.emit('showDataForm', "Store a new custom process", fields, data => this.addProcess(script, data));
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
		addProcess(script, data) {
			data = this.normalizeToDefaultData(data);
			this.connection.setUserProcess(script, data.title, data.description)
				.then(data => {
					this.$refs.table.addData(data);
					Utils.ok(this, 'Process graph successfully stored!');
				}).catch(error => Utils.exception(this, error, 'Storing process graph failed.'));
		},
		graphInfo(process) {
			this.refreshCustomProcess(process, updated => {
				this.emit('showCustomProcessInfo', updated);
			});
		},
		editMetadata(oldPg) {
			this.refreshCustomProcess(oldPg, process => {
				var fields = [
					this.getTitleField().setValue(process.title),
					this.getDescriptionField().setValue(process.description)
				];
				this.emit('showDataForm', "Edit metadata for a process graph", fields, data => this.updateMetadata(process, data));
			});
		},
		replaceProcess(process) {
			this.emit('getCustomProcess', script => this.updateMetadata(process, {process: script}));
		},
		updateTitle(process, newTitle) {
			this.updateMetadata(process, {title: newTitle});
		},
		updateMetadata(process, data) {
			data = this.normalizeToDefaultData(data);
			process.replaceUserProcess(data)
				.then(updatePg => {
					Utils.ok(this, "Process graph successfully updated.");
					this.replaceUserProcessData(updatePg);
				})
				.catch(error => Utils.exception(this, error, "Updating process graph failed"));
		},
		deleteProcess(process) {
			process.deleteUserProcess()
				.then(() => {
					this.$refs.table.removeData(process.id);
				})
				.catch(error => Utils.exception(this, error, 'Deleting process graph failed'));
		},
		replaceUserProcessData(updatePg) {
			this.$refs.table.replaceData(updatePg);
		}
	}
}
</script>