<template>
	<DataTable ref="table" :data="data" :columns="columns" class="CustomProcessPanel">
		<template slot="toolbar">
			<button title="Add new custom process" @click="addProcessFromScript" v-show="supportsCreate" :disabled="!this.hasProcess"><i class="fas fa-plus"></i> Add</button>
		</template>
		<template #actions="p">
			<button title="Details" @click="processInfo(p.row)" v-show="supportsRead"><i class="fas fa-info"></i></button>
			<button title="Edit process" @click="showInEditor(p.row)" v-show="supportsRead"><i class="fas fa-project-diagram"></i></button>
			<button title="Delete" @click="deleteProcess(p.row)" v-show="supportsDelete"><i class="fas fa-trash"></i></button>
		</template>
	</DataTable>
</template>

<script>
import EventBusMixin from './EventBusMixin.vue';
import WorkPanelMixin from './WorkPanelMixin';
import Utils from '../utils.js';
import { UserProcess } from '@openeo/js-client';

export default {
	name: 'CustomProcessPanel',
	mixins: [WorkPanelMixin('userProcesses', 'custom process', 'custom processes', false), EventBusMixin],
	data() {
		return {
			columns: {
				id: {
					name: 'ID',
					primaryKey: true,
					sort: 'asc'
				},
				summary: {
					name: 'Summary'
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
		...Utils.mapState('editor', ['process']),
		...Utils.mapGetters(['processes']),
		...Utils.mapGetters('editor', ['hasProcess']),
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
				value,
				name: "id",
				description: 'A unique identifier. Must contain only letters (`a`-`z`), digits (`0`-`9`) and underscores (`_`). `snake_case` is recommended.',
				label: 'Process ID',
				schema: {
					type: 'string',
					pattern: '^\\w+$'
				},
				default: null
			};
		},
		addProcessFromScript() {
			let fields = [];
			if (!this.process.id) {
				fields.push(this.getIdField());
			}
			else if (!this.process.id.match('^\\w+$')) {
				fields.push({
					label: 'Please note...',
					description: 'The given process name is invalid, please choose another one below.',
					info: true
				});
				fields.push(this.getIdField(this.process.id));
			}
			else if (this.processes.has(this.process.id, 'user')) {
				fields.push({
					label: 'Warning!',
					description: "A process with the given name exists! If you click 'Save' below, you confirm that you want to override the existing process. If you don't want to override the existing process, please choose a different name below.",
					info: true
				});
				fields.push(this.getIdField(this.process.id));
			}
			let store = data => this.addProcess(this.normalize(this.process, data));
			if (fields.length > 0) {
				this.emit('showDataForm', 'Store a new custom process', fields, store);
			}
			else {
				store();
			}
		},
		normalize(process, data = {}) {
			return Object.assign(
				{},
				typeof process.toJSON === 'function' ? process.toJSON() : process,
				data
			);
		},
		addProcess(process) {
			this.create({parameters: [process.id, process]})
				.catch(error => Utils.exception(this, error, 'Store Process Error' + (process.id ? `: ${process.id}` : '')));
		},
		processInfo(process) {
			this.emit('showProcess', process);
		},
		replaceProcess(process, newProcess) {
			if (process instanceof UserProcess) {
				this.updateMetadata(process, newProcess)
			}
		},
		async updateMetadata(process, data) {
			try {
				let updatedProcess = await this.update({data: process, parameters: this.normalize(process, data)});
				Utils.ok(this, 'Process "' + Utils.getResourceTitle(updatedProcess) + '" successfully updated.');
			} catch (error) {
				Utils.exception(this, error, 'Update Process Error' + (process.id ? `: ${process.id}` : ''));
			}
		},
		deleteProcess(process) {
			if (!confirm(`Do you really want to delete the process "${Utils.getResourceTitle(process)}"?`)) {
				return;
			}
			this.delete({data: process})
				.catch(error => Utils.exception(this, error, 'Delete Process Error' + (process.id ? `: ${process.id}` : '')));
		}
	}
}
</script>

<style>
.CustomProcessPanel .id {
	width: 25%;
}
</style>