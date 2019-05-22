<template>
	<DataTable ref="table" :dataSource="listServices" :columns="columns" id="ServicePanel">
		<template slot="toolbar">
			<button title="Add new service" @click="createServiceFromScript()" v-show="supports('createService')"><i class="fas fa-plus"></i> Add</button>
			<button title="Refresh services" @click="updateData()"><i class="fas fa-sync-alt"></i></button> <!-- ToDo: Should be done automatically later -->
		</template>
		<template slot="enabled" slot-scope="p">
			<span class="boolean">
				<span v-show="p.row.enabled === true"><i class="fas fa-check-circle"></i></span>
				<span v-show="p.row.enabled === false"><i class="fas fa-times-circle"></i></span>
				<span v-show="typeof p.row.enabled !== 'boolean'"><i class="fas fa-question-circle"></i></span>
			</span>
		</template>
		<template slot="actions" slot-scope="p">
			<button title="Details" @click="serviceInfo(p.row)" v-show="supports('describeService')"><i class="fas fa-info"></i></button><button title="Show in Editorr" @click="showInEditor(p.row)" v-show="supports('describeService')"><i class="fas fa-code-branch"></i></button>
			<button title="Update process graph" @click="updateProcessGraph(p.row)" v-show="supports('updateService')"><i class="fas fa-edit"></i></button>
			<button title="Delete" @click="deleteService(p.row)" v-show="supports('deleteService')"><i class="fas fa-trash"></i></button>
			<button v-show="p.row.enabled" title="View on map" @click="viewService(p.row)"><i class="fas fa-map"></i></button>
		</template>
	</DataTable>
</template>

<script>
import EventBus from '../eventbus.js';
import WorkPanelMixin from './WorkPanelMixin.vue';
import Utils from '../utils.js';

export default {
	name: 'ServicePanel',
	mixins: [WorkPanelMixin],
	computed: {
		...Utils.mapState('server', ['serviceTypes'])
	},
	data() {
		return {
			columns: {
				serviceId: {
					name: 'ID',
					primaryKey: true,
					hide: true
				},
				title: {
					name: 'Title',
					computedValue: (row, value) => {
						if (!value && row.serviceId) {
							return "Service #" + row.serviceId.toUpperCase().substr(0,6);
						}
						return value;
					},
					edit: this.updateTitle
				},
				type: {
					name: 'Type',
					format: "UpperCase",
				},
				enabled: {
					name: 'Enabled',
					edit: this.toggleEnabled
				},
				submitted: {
					name: 'Submitted',
					format: 'DateTime'
				},
				actions: {
					name: 'Actions',
					filterable: false
				}
			}
		};
	},
	created() {
		EventBus.$on('serviceCreated', this.serviceCreated);
	},
	methods: {
		listServices() {
			return this.connection.listServices();
		},
		updateData() {
			this.updateTable(this.$refs.table, 'listServices', 'createService');
		},
		refreshService(service, callback = null) {
			service.describeService()
				.then(updatedService => {
					if (typeof callback === 'function') {
						callback(updatedService);
					}
					this.updateServiceData(updatedService);
				})
				.catch(error => Utils.exception(this, error, "Sorry, could not load service information."));
		},
		showInEditor(service) {
			this.refreshService(service, updatedService => {
				EventBus.$emit('insertProcessGraph', updatedService.processGraph);
			});
		},
		serviceCreated(service) {
			if (!this.$refs.table) {
				return;
			}

			this.$refs.table.addData(service);

			var buttons = [
				{text: 'View on map', action: () => this.viewService(service)}
			];
			if (this.supports('describeService')) {
				buttons.push({text: 'Details', action: () => this.serviceInfo(service)});
			}
			if (this.supports('deleteService')) {
				buttons.push({text: 'Delete', action: () => this.deleteService(service)});
			}
			Utils.confirm(this, 'Web Service created!', buttons);
		},
		createService(processGraph, type, title = null) {
			this.connection.createService(processGraph, type, title)
				.then(service => {
					EventBus.$emit('serviceCreated', service);
				}).catch(error => {
					Utils.exception(this, error, 'Sorry, could not create the web service.');
				});
		},
		createServiceFromScript() {
			var title = prompt("Please specify a title for the service:");
			if (title === null) {
				return;
			}
			else if (typeof title !== 'string' || title.length === 0) {
				title = null;
			}

			var serviceTypes = Object.keys(this.serviceTypes).map(v => v.toUpperCase());
			var type = '';
			if (serviceTypes.length == 1) {
				type = serviceTypes[0];
			}
			else {
				do {
					var msgPrefix = '';
					if (type !== '') {
						msgPrefix = "Specified service type is invalid.\r\n";
					}
					var type = prompt(msgPrefix + "Please specify the service type:\r\nOne of: ".serviceTypes.join(', '), type);
					if (type === null) {
						return;
					}
					else if (typeof type === 'string') {
						type = type.toUpperCase();
						if (!serviceTypes.includes(type)) {
							type = '';
						}
					}
					else {
						type = '';
					}
				} while(type.length == 0);
			}
			
			// ToDo: Ask user for service arguments
			EventBus.$emit('getProcessGraph', script => this.createService(script, type, title));
		},
		serviceInfo(service) {
			this.refreshService(service, updatedService => {
				EventBus.$emit('showServiceInfo', updatedService.getAll());
			});
		},
		updateProcessGraph(service) {
			EventBus.$emit('getProcessGraph', script => {
				service.updateService({processGraph: script})
					.then(updatedService => {
						Utils.ok(this, "Service process graph successfully updated.");
						this.updateServiceData(updatedService);
					})
					.catch(error => Utils.exception(this, error, "Sorry, could not update service process graph."));
			}, false);
		},
		updateTitle(service, newTitle) {
			service.updateService({title: newTitle})
				.then(updatedService => {
					Utils.ok(this, "Service title successfully updated.");
					this.updateServiceData(updatedService);
				})
				.catch(error => Utils.exception(this, error, "Sorry, could not update service title."));
		},
		toggleEnabled(service) {
			service.updateService({enabled: !service.enabled})
				.then(updatedService => {
					Utils.ok(this, "Service successfully changed service state.");
					this.updateServiceData(updatedService);
				})
				.catch(error => Utils.exception(this, error, "Sorry, could not change service state."));
		},
		deleteService(service) {
			service.deleteService()
				.then(() => {
					this.$refs.table.removeData(service.serviceId);
					EventBus.$emit('removeWebService', service.serviceId);
				})
				.catch(error => {
					Utils.exception(this, error, 'Sorry, could not delete service.');
				});
		},
		viewService(service) {
			Utils.info(this, 'Requesting tiles from server. Please wait...');
			EventBus.$emit('viewWebService', service);
			EventBus.$emit('showMapViewer');
		},
		updateServiceData(updatedService) {
			this.$refs.table.replaceData(updatedService);
		}
	}
}
</script>

<style>
#ServicePanel .serviceId {
	width: 35%;
}
#ServicePanel .type {
	width: 10%;
	text-align: center;
}
#ServicePanel .enabled {
	width: 10%;
	text-align: center;
}
#ServicePanel .submitted {
	width: 20%;
}
#ServicePanel .actions {
	width: 25%;
}
</style>