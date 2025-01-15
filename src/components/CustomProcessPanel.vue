<template>
	<DataTable ref="table" fa :data="data" :columns="columns" :next="next" class="CustomProcessPanel">
		<template slot="toolbar">
			<AsyncButton title="Store the process in the process editor on the server" :fn="addProcessFromScript" v-show="supportsCreate" :disabled="!this.hasProcess" fa confirm icon="fas fa-plus">Add</AsyncButton>
			<SyncButton v-if="supportsList" :name="plualizedName" :sync="reloadData" />
			<FullscreenButton :element="() => this.$el" />
		</template>
		<template #actions="p">
			<AsyncButton title="Show details about this process" :fn="() => processInfo(p.row)" v-show="supportsRead" fa icon="fas fa-info"></AsyncButton>
			<AsyncButton title="Edit this process in the process editor" confirm :fn="() => showInEditor(p.row)" v-show="supportsRead" fa icon="fas fa-project-diagram"></AsyncButton>
			<AsyncButton title="Delete this custom process from the server" :fn="() => deleteProcess(p.row)" v-show="supportsDelete" fa icon="fas fa-trash"></AsyncButton>
		</template>
	</DataTable>
</template>

<script>
import EventBusMixin from './EventBusMixin';
import WorkPanelMixin from './WorkPanelMixin';
import FullscreenButton from './FullscreenButton.vue';
import SyncButton from './SyncButton.vue';
import AsyncButton from '@openeo/vue-components/components/internal/AsyncButton.vue';
import Utils from '../utils.js';
import { UserProcess } from '@openeo/js-client';

export default {
	name: 'CustomProcessPanel',
	mixins: [WorkPanelMixin('userProcesses', 'custom process', 'custom processes', false), EventBusMixin],
	components: {
		AsyncButton,
		FullscreenButton,
		SyncButton
	},
	data() {
		return {
			columns: {
				id: {
					name: 'ID',
					primaryKey: true,
					sort: 'asc',
					width: '30%'
				},
				summary: {
					name: 'Summary',
					width: '50%'
				},
				actions: {
					name: 'Actions',
					filterable: false,
					sort: false,
					width: '20%'
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
		async showInEditor(process) {
			await this.refreshElement(process, updatedProcess => this.broadcast('editProcess', updatedProcess));
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
		async addProcessFromScript() {
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
			return new Promise((resolve, reject) => {
				let store = data => this.addProcess(this.normalize(this.process, data))
					.then(ok => ok ? resolve() : reject())
					.catch(reject);
				if (fields.length > 0) {
					this.broadcast('showDataForm', 'Store a new custom process', fields, store);
				}
				else {
					store();
				}
			});
		},
		normalize(process, data = {}) {
			return Object.assign(
				{},
				typeof process.toJSON === 'function' ? process.toJSON() : process,
				data
			);
		},
		async addProcess(process) {
			try {
				await this.create([process.id, process]);
				return true;
			} catch (error) {
				Utils.exception(this, error, 'Store Process Error' + (process.id ? `: ${process.id}` : ''));
				return false;
			};
		},
		processInfo(process) {
			this.broadcast('showProcess', process);
		},
		async replaceProcess(process, newProcess, resolve, reject) {
			if (process instanceof UserProcess) {
				try {
					await this.updateMetadata(process, newProcess);
					resolve();
				} catch (error) {
					reject(error);
				}
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
		async deleteProcess(process) {
			if (!confirm(`Do you really want to delete the process "${Utils.getResourceTitle(process)}"?`)) {
				return;
			}
			try {
				await this.delete({data: process});
			} catch (error) {
				Utils.exception(this, error, 'Delete Process Error' + (process.id ? `: ${process.id}` : ''));
			}
		}
	}
}
</script>
