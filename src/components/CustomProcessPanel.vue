<template>
	<DataTable ref="table" :data="data" :columns="columns" id="CustomProcessPanel">
		<template slot="toolbar">
			<button title="Add new custom process" @click="addProcessFromScript" v-show="supportsCreate"><i class="fas fa-plus"></i> Add</button>
		</template>
		<template slot="actions" slot-scope="p">
			<button title="Details" @click="graphInfo(p.row)" v-show="supportsRead"><i class="fas fa-info"></i></button>
			<button title="Show in Editor" @click="showInEditor(p.row)" v-show="supportsRead"><i class="fas fa-code-branch"></i></button>
			<!-- ToDo: Align with 1.0, move edit metadata to visual model editor -->
			<button title="Edit metadata" @click="editMetadata(p.row)" v-show="supportsUpdate"><i class="fas fa-edit"></i></button>
			<button title="Replace process" @click="replaceProcess(p.row)" v-show="supportsUpdate"><i class="fas fa-retweet"></i></button>
			<button title="Delete" @click="deleteProcess(p.row)" v-show="supportsDelete"><i class="fas fa-trash"></i></button>
		</template>
	</DataTable>
</template>

<script>
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import WorkPanelMixin from './WorkPanelMixin';
import Utils from '../utils.js';
import Field from './blocks/field';

export default {
	name: 'CustomProcessPanel',
	mixins: [WorkPanelMixin('userProcesses', 'custom process', 'custom processes'), EventBusMixin],
	data() {
		return {
			columns: {
				id: {
					name: 'ID',
					primaryKey: true
				},
				summary: {
					name: 'Summary',
					edit: this.updateSummary
				},
				actions: {
					name: 'Actions',
					filterable: false
				}
			}
		};
	},
	methods: {
		showInEditor(process) {
			this.refreshElement(process, updatedProcess => {
				this.emit('insertCustomProcess', updatedProcess.toJSON());
			});
		},
		getIdField(defaultValue = undefined) {
			return new Field('id', 'Name', {type: 'string'}, defaultValue, '', true);
		},
		getSummaryField(defaultValue = undefined) {
			return new Field('summary', 'Summary', {type: 'string'}, defaultValue);
		},
		getDescriptionField(defaultValue = undefined) {
			return new Field('description', 'Description', {type: 'string', subtype: 'commonmark'}, defaultValue, 'CommonMark (Markdown) is allowed.');
		},
		getCategoriesField(defaultValue = undefined) {
			return new Field('categories', 'Categories', {type: 'array', items: {type: 'string'}}, defaultValue);
		},
		getDeprecatedField(defaultValue = false) {
			return new Field('deprecated', 'Deprecated', {type: 'boolean'}, defaultValue);
		},
		getExperimentalField(defaultValue = false) {
			return new Field('experimental', 'Experimental', {type: 'boolean'}, defaultValue);
		},
		getFields(process) {
			return [
				this.getIdField(process.id),
				this.getSummaryField(process.summary),
				this.getDescriptionField(process.description),
				this.getCategoriesField(process.categories),
				this.getDeprecatedField(process.deprecated),
				this.getExperimentalField(process.experimental)
			];
		},
		// Add parameters, return value, exceptions, examples, links
		addProcessFromScript() {
			this.emit('getCustomProcess', process => {
				let fields = this.getFields(process);
				this.emit('showDataForm', "Store a new custom process", fields, data => this.addProcess(this.normalize(process, data)));
			});
		},
		normalize(process, data) {
			return Object.assign(
				{},
				typeof process.toJSON === 'function' ? process.toJSON() : process,
				data
			);
		},
		addProcess(process) {
			this.create({parameters: [process.id, process]})
				.catch(error => Utils.exception(this, error, 'Storing custom process failed.'));
		},
		graphInfo(process) {
			this.refreshElement(process, updated => {
				this.emit('showProcessInfo', updated);
			});
		},
		editMetadata(oldPg) {
			this.refreshElement(oldPg, process => {
				let fields = this.getFields(process);
				this.emit('showDataForm', "Edit metadata for a process graph", fields, data => this.updateMetadata(process, data));
			});
		},
		replaceProcess(process) {
			this.emit('getCustomProcess', script => this.updateMetadata(process, {process: script}));
		},
		updateSummary(process, newTitle) {
			this.updateMetadata(process, {title: newTitle});
		},
		updateMetadata(process, data) {
			this.update({data: process, parameters: this.normalize(process, data)})
				.catch(error => Utils.exception(this, error, "Updating process graph failed"));
		},
		deleteProcess(process) {
			this.delete({data: process})
				.catch(error => Utils.exception(this, error, 'Deleting process graph failed'));
		}
	}
}
</script>