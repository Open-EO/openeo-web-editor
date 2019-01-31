<template>
	<DataTable ref="table" :dataSource="listServices" :columns="columns" id="ServicePanel">
		<template slot="toolbar">
			<button title="Add new service" @click="createServiceFromScript()" v-show="supports('createService')"><i class="fas fa-plus"></i> Add</button>
			<button title="Refresh services" @click="updateData()"><i class="fas fa-sync-alt"></i></button> <!-- ToDo: Should be done automatically later -->
		</template>
		<template slot="enabled" slot-scope="p">
			<span class="enabled">
				<i v-if="p.row.enabled === true" class="fas fa-check-circle"></i>
				<i v-else-if="p.row.enabled === false" class="fas fa-times-circle"></i>
				<i v-else class="fas fa-question-circle"></i>
			</span>
		</template>
		<template slot="actions" slot-scope="p">
			<button title="Details" @click="serviceInfo(p.row)" v-show="supports('describeService')"><i class="fas fa-info"></i></button>
			<button title="Edit" @click="editService(p.row)" v-show="supports('updateService')"><i class="fas fa-edit"></i></button>
			<button title="Delete" @click="deleteService(p.row)" v-show="supports('deleteService')"><i class="fas fa-trash"></i></button>
			<button title="View on map" @click="viewService(p.row)"><i class="fas fa-map"></i></button>
		</template>
	</DataTable>
</template>

<script>
import EventBus from '../eventbus.js';
import WorkPanelMixin from './WorkPanelMixin.vue';

export default {
	name: 'ServicePanel',
	mixins: [WorkPanelMixin],
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
					}
				},
				type: {
					name: 'Type',
					format: "UpperCase",
				},
				enabled: {
					name: 'Enabled'
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
		serviceCreated(service) {
			if (!this.$refs.table) {
				return;
			}

			this.$refs.table.addData(service);

			var options = {
				buttons: []
			};
			options.buttons.push({text: 'View', action: () => this.viewService(service)});
			if (this.supports('describeService')) {
				options.buttons.push({text: 'Details', action: () => this.serviceInfo(service)});
			}
			if (this.supports('updateService')) {
				options.buttons.push({text: 'Edit', action: () => this.editService(service)});
			}
			if (this.supports('deleteService')) {
				options.buttons.push({text: 'Delete', action: () => this.deleteService(service)});
			}
			this.$utils.confirm(this, 'Web Service created!', options);
		},
		createService(processGraph, type, title = null) {
			this.connection.createService(processGraph, type, title)
				.then(service => {
					EventBus.$emit('serviceCreated', service);
				}).catch(error => {
					this.$utils.exception(this, error, 'Sorry, could not create the web service.');
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

			var serviceTypes = Object.keys(this.connection.supportedServices).map(v => v.toUpperCase());
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
			EventBus.$emit('getProcessGraph', (script) => {
				this.createService(script, type, title);
			});
		},
		serviceInfo(service) {
			service.describeService()
				.then(updatedService => {
					EventBus.$emit('showModal', 'Web Service Details', updatedService.getAll());
					this.updateServiceData(updatedService);
				}).catch(error => {
					this.$utils.exception(this, error, 'Sorry, could not load service information.');
				});
		},
		editService(service) {
			// TODO: provide more update options/don't just override the process graph and nothing else
			EventBus.$emit('getProcessGraph', (script) => {
				service.updateService(script)
					.then(updatedService => {
						this.$utils.ok(this, "Service successfully updated.");
						this.updateServiceData(updatedService);
					})
					.catch(error => this.$utils.exception(this, error, "Sorry, could not update service."));;
			}, false);
		},
		deleteService(service) {
			service.deleteService()
				.then(() => {
					this.$refs.table.removeData(service.serviceId);
					EventBus.$emit('removeWebService', service.serviceId);
				})
				.catch(error => {
					this.$utils.exception(this, error, 'Sorry, could not delete service.');
				});
		},
		viewService(service) {
			this.$utils.info(this, 'Requesting tiles from server. Please wait...');
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
.enabled .fa-check-circle {
	color: green;
}
.enabled .fa-times-circle {
	color: red;
}
.enabled .fa-question-circle {
	color: #555;
}
</style>