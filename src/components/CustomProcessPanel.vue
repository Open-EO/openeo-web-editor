<template>
	<DataTable ref="table" :data="data" :columns="columns" id="CustomProcessPanel">
		<template slot="toolbar">
			<button title="Add new custom process" @click="addProcessFromScript" v-show="supportsCreate"><i class="fas fa-plus"></i> Add</button>
		</template>
		<template slot="actions" slot-scope="p">
			<button title="Details" @click="processInfo(p.row)" v-show="supportsRead"><i class="fas fa-info"></i></button>
			<!-- ToDo: Align with 1.0, move edit metadata to visual model editor -->
			<button title="Edit metadata" @click="editMetadata(p.row)" v-show="supportsUpdate"><i class="fas fa-edit"></i></button>
			<button title="Edit process" @click="showInEditor(p.row)" v-show="supportsRead"><i class="fas fa-project-diagram"></i></button>
			<button title="Delete" @click="deleteProcess(p.row)" v-show="supportsDelete"><i class="fas fa-trash"></i></button>
		</template>
	</DataTable>
</template>

<script>
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import WorkPanelMixin from './WorkPanelMixin';
import Utils from '../utils.js';
import { UserProcess } from '@openeo/js-client';

export default {
	name: 'CustomProcessPanel',
	mixins: [WorkPanelMixin('userProcesses', 'custom process', 'custom processes'), EventBusMixin],
	data() {
		return {
			columns: {
				id: {
					name: 'ID',
					primaryKey: true,
					sort: 'asc'
				},
				summary: {
					name: 'Summary',
					edit: this.updateSummary
				},
				actions: {
					name: 'Actions',
					filterable: false,
					sort: false
				}
			}
		};
	},
	computed: {
		...Utils.mapState('editor', ['process'])
	},
	mounted() {
		this.listen('replaceProcess', this.replaceProcess);
	},
	methods: {
		showInEditor(process) {
			this.refreshElement(process, updatedProcess => this.emit('editProcess', updatedProcess));
		},
		getIdField(value = undefined) {
			return {
				name: 'id',
				label: 'Name',
				schema: {type: 'string'},
				default: null,
				value: value
			};
		},
		getSummaryField(value = undefined) {
			return {
				name: 'summary',
				label: 'Summary',
				schema: {type: 'string'},
				default: null,
				value: value,
				optional: true
			};
		},
		getDescriptionField(value = undefined) {
			return {
				name: 'description',
				label: 'Description',
				schema: {type: 'string', subtype: 'commonmark'},
				default: null,
				value: value,
				description: 'CommonMark (Markdown) is allowed.',
				optional: true
			};
		},
		getCategoriesField(value = undefined) {
			return {
				name: 'categories',
				label: 'Categories',
				schema: {type: 'array', items: {type: 'string'}},
				default: [],
				value: value,
				optional: true
			};
		},
		getDeprecatedField(value = false) {
			return {
				name: 'deprecated',
				label: 'Deprecated',
				schema: {type: 'boolean'},
				default: false,
				value: value,
				optional: true
			};
		},
		getExperimentalField(value = false) {
			return {
				name: 'experimental',
				label: 'Experimental',
				schema: {type: 'boolean'},
				default: false,
				value: value,
				optional: true
			};
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
			let fields = this.getFields(this.process);
			this.emit('showDataForm', "Store a new custom process", fields, data => this.addProcess(this.normalize(this.process, data)));
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
		processInfo(process) {
			this.emit('showProcessInfo', process);
		},
		editMetadata(oldPg) {
			this.refreshElement(oldPg, process => {
				let fields = this.getFields(process);
				this.emit('showDataForm', "Edit metadata for a process graph", fields, data => this.updateMetadata(process, data));
			});
		},
		replaceProcess(process, newProcess) {
			if (process instanceof UserProcess) {
				this.updateMetadata(process, newProcess)
			}
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