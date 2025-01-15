<template>
	<DataTable ref="table" fa :data="data" :columns="columns" :next="next" class="ServicePanel">
		<template slot="toolbar">
			<AsyncButton title="Create a new permanent service from the process in the process editor" :fn="createServiceFromScript" v-show="supportsCreate" :disabled="!this.hasProcess" fa confirm icon="fas fa-plus">Create</AsyncButton>
			<AsyncButton title="Quickly show the process on map without storing it permanently" :fn="quickViewServiceFromScript" v-show="supportsQuickView" :disabled="!this.hasProcess" fa confirm icon="fas fa-map">Show on Map</AsyncButton>
			<SyncButton v-if="supportsList" :name="plualizedName" :sync="reloadData" />
			<FullscreenButton :element="() => this.$el" />
		</template>
		<template #actions="p">
			<AsyncButton title="Show details about this service" :fn="() => serviceInfo(p.row)" v-show="supportsRead" fa icon="fas fa-info"></AsyncButton>
			<AsyncButton title="Edit the metadata of this service" :fn="() => editMetadata(p.row)" v-show="supportsUpdate" fa icon="fas fa-edit"></AsyncButton>
			<AsyncButton title="Edit the process of this service in the process editor" confirm :fn="() => showInEditor(p.row)" v-show="supportsRead" fa icon="fas fa-project-diagram"></AsyncButton>
			<AsyncButton title="Delete this service from the server" :fn="() => deleteService(p.row)" v-show="supportsDelete" fa icon="fas fa-trash"></AsyncButton>
			<AsyncButton title="View this service" :fn="() => viewService(p.row)" v-show="p.row.enabled && isMapServiceSupported(p.row.type)" fa icon="fas fa-map"></AsyncButton>
			<AsyncButton title="Export and/or share this service" :fn="() => shareResults(p.row)" v-show="p.row.enabled && canShare" fa icon="fas fa-share"></AsyncButton>
			<AsyncButton title="View the logs of this service" :fn="() => showLogs(p.row)" v-show="supportsDebug" fa icon="fas fa-bug"></AsyncButton>
		</template>
	</DataTable>
</template>

<script>
import EventBusMixin from './EventBusMixin';
import WorkPanelMixin from './WorkPanelMixin';
import FieldMixin from './FieldMixin';
import AsyncButton from '@openeo/vue-components/components/internal/AsyncButton.vue';
import FullscreenButton from './FullscreenButton.vue';
import SyncButton from './SyncButton.vue';
import Utils from '../utils';
import { Service } from '@openeo/js-client';
import { mapMutations } from 'vuex';

export default {
	name: 'ServicePanel',
	mixins: [
		WorkPanelMixin('services', 'web service', 'web services'),
		EventBusMixin,
		FieldMixin
	],
	components: {
		AsyncButton,
		FullscreenButton,
		SyncButton
	},
	data() {
		return {
			createdQuickViews: {}
		};
	},
	computed: {
		...Utils.mapState('editor', ['process']),
		...Utils.mapGetters('editor', ['hasProcess']),
		...Utils.mapState(['serviceTypes']),
		...Utils.mapGetters(['supports', 'supportsBilling', 'supportsBillingPlans']),
		columns() {
			return {
				id: {
					name: 'ID',
					primaryKey: true,
					hide: true
				},
				title: {
					name: 'Web Service',
					computedValue: row => Utils.getResourceTitle(row),
					format: value => Utils.formatIdOrTitle(value),
					edit: this.supportsUpdate ? this.updateTitle : null,
					width: '30%'
				},
				type: {
					name: 'Type',
					format: value => typeof value === 'string' ? value.toUpperCase() : value,
					width: '15%'
				},
				enabled: {
					name: 'Enabled',
					edit: this.supportsUpdate ? this.toggleEnabled : null,
					width: '5%'
				},
				created: {
					name: 'Submitted',
					format: 'Timestamp',
					sort: 'desc',
					width: '15%'
				},
				actions: {
					name: 'Actions',
					filterable: false,
					sort: false,
					width: '35%'
				}
			};
		},
		canShare() {
			return Array.isArray(this.$config.supportedBatchJobSharingServices) && this.$config.supportedBatchJobSharingServices.length > 0;
		},
		supportsDebug() {
			return this.supports('debugService');
		},
		supportsQuickView() {
			return this.supportsCreate && this.supportsDelete && this.mapService !== null;
		},
		mapService() {
			for(let key in this.serviceTypes) {
				if (!Utils.isMapServiceSupported(key)) {
					continue;
				}
				let service = this.serviceTypes[key];
				let hasRequiredParam = Object.values(service.configuration).some(param => param.required === true);
				if (hasRequiredParam) {
					continue;
				}
				return key;
			}
			return null;
		}
	},
	mounted() {
		this.listen('replaceProcess', this.replaceProcess);
		this.beforeLogoutListener({key: this.$options.name, listener: this.onExit});
	},
	beforeDestroy() {
		this.beforeLogoutListener({key: this.$options.name});
	},
	methods: {
		...mapMutations(['beforeLogoutListener']),
		async onExit() {
			let promises = [];
			for(let id in this.createdQuickViews) {
				let service = this.createdQuickViews[id];
				promises.push(this.deleteService(service, true));
			}
			await Promise.all(promises);
			this.createdQuickViews = {};
		},
		isMapServiceSupported(type) {
			return Utils.isMapServiceSupported(type);
		},
		async showInEditor(service) {
			await this.refreshElement(service, updatedService => this.broadcast('editProcess', updatedService));
		},
		showLogs(service) {
			this.broadcast('viewLogs', service);
		},
		serviceCreated(service) {
			var buttons = [];
			if (this.isMapServiceSupported(service.type)) {
				buttons.push({text: 'View on map', action: () => this.viewService(service)});
			}
			if (this.supportsRead) {
				buttons.push({text: 'Details', action: () => this.serviceInfo(service)});
			}
			if (this.supportsDelete) {
				buttons.push({text: 'Delete', action: () => this.deleteService(service)});
			}
			Utils.confirm(this, 'Web Service created!', buttons);
		},
		getServiceTypeField(value = undefined) {
			return {
				name: 'type',
				label: 'Type',
				schema: {type: 'string', subtype: 'service-type'},
				value: value
			};
		},
		getEnabledField(value = true) {
			return {
				name: 'enabled',
				label: 'Enabled',
				schema: {type: 'boolean'},
				default: true,
				value: value,
				optional: true
			};
		},
		getConfigField(value = undefined) {
			return {
				name: 'configuration',
				label: 'Service Configuration',
				schema: {type: 'object', subtype: 'service-config'},
				value: value,
				optional: true
			};
		},
		normalizeToDefaultData(data) {
			if (typeof data.title !== 'undefined' && (typeof data.title !== 'string' || data.title.length === 0)) {
				data.title = null;
			}
			if (typeof data.description !== 'undefined' && (typeof data.description !== 'string' || data.description.length === 0)) {
				data.description = null;
			}
			if (typeof data.enabled !== 'undefined' && typeof data.enabled !== 'boolean') {
				data.enabled = true;
			}
			if (typeof data.configuration !== 'undefined' && !Utils.isObject(data.configuration)) {
				data.configuration = {};
			}
			if (typeof data.plan !== 'undefined' && (typeof data.plan !== 'string' || data.plan.length === 0)) {
				data.plan = null;
			}
			if (typeof data.budget !== 'undefined' && (typeof data.budget !== 'number' || data.budget < 0)) {
				data.budget = null;
			}
			return data;
		},
		async createService(script, data, quiet = false) {
			data = this.normalizeToDefaultData(data);
			try {
				let service = await this.create([
					script,
					data.type,
					data.title,
					data.description,
					data.enabled,
					data.configuration,
					data.plan,
					data.budget,
					{log_level: data.log_level}
				]);
				if (!quiet) {
					this.serviceCreated(service);
				}
				return service;
			} catch(error) {
				Utils.exception(this, error, 'Create Service Error: ' + (data.title || ''));
				return null;
			}
		},
		async createServiceFromScript() {
			var fields = [
				this.getTitleField(),
				this.getDescriptionField(),
				this.getServiceTypeField(),
				this.getEnabledField(),
				this.getLogLevelField(),
				this.supportsBillingPlans ? this.getBillingPlanField() : null,
				this.supportsBilling ? this.getBudgetField() : null,
				this.getConfigField()
			];
			return new Promise((resolve, reject) => {
				this.broadcast('showDataForm', "Create new web service", fields, data => {
					this.createService(this.process, data)
						.then(service => service ? resolve(service) : reject())
						.catch(reject);
				});
			});
		},
		async quickViewServiceFromScript() {
			try {
				let settings = {
					title: 'Quick view',
					type: this.mapService,
					enabled: true
				};
				let service = await this.createService(this.process, settings, true);
				if (service) {
					this.createdQuickViews[service.id] = service;
					this.viewService(service, () => this.deleteService(service, true));
				}
			} catch(error) {
				Utils.exception(this, error, "Show on Map Error");
			}
		},
		async editMetadata(oldService) {
			await this.refreshElement(oldService, service => {
				var fields = [
					this.getTitleField(service.title),
					this.getDescriptionField(service.description),
					this.getEnabledField(service.enabled),
					this.getLogLevelField(service.log_level),
					this.supportsBillingPlans ? this.getBillingPlanField(service.plan) : null,
					this.supportsBilling ? this.getBudgetField(service.budget) : null,
					this.getConfigField(service.configuration)
				];
				this.broadcast('showDataForm', "Edit web service", fields, data => this.updateService(service, data));
			});
		},
		async serviceInfo(service) {
			await this.refreshElement(service, updatedService => {
				this.broadcast('showModal', 'ServiceInfoModal', {service: updatedService.getAll()});
			});
		},
		async replaceProcess(service, process, resolve, reject) {
			if (service instanceof Service) {
				try {
					await this.updateService(service, {process: process});
					resolve();
				} catch(error) {
					reject(error);
				}
			}
		},
		updateTitle(service, newTitle) {
			this.updateService(service, {title: newTitle});
		},
		toggleEnabled(service) {
			this.updateService(service, {enabled: !service.enabled});
		},
		async updateService(service, parameters) {
			try {
				let updatedService = await this.update({data: service, parameters: this.normalizeToDefaultData(parameters)});
				Utils.ok(this, 'Service "' + Utils.getResourceTitle(updatedService) + '" successfully updated.');
			} catch(error) {
				Utils.exception(this, error, "Update Service Error: " + Utils.getResourceTitle(service));
			}
		},
		async deleteService(service, quiet = false) {
			if (!quiet && !confirm(`Do you really want to delete the service "${Utils.getResourceTitle(service)}"?`)) {
				return;
			}
			try {
				await this.delete({data: service});
				this.broadcast('removeWebService', service.id);
				delete this.createdQuickViews[service.id];
				if (this.hasMore) {
					this.reloadData();
				}
			} catch(error) {
				if (quiet) {
					console.error(error);
				}
				else {
					Utils.exception(this, error, 'Delete Service Error: ' + Utils.getResourceTitle(service));
				}
			}
		},
		async viewService(service, onClose = null) {
			await this.refreshElement(service, updatedService => this.broadcast('viewWebService', updatedService, onClose));
		},
		async shareResults(service) {
			if (this.canShare) {
				return;
			}
			await this.refreshElement(service, service2 => {
				if (!service.enabled) {
					Utils.error(this, "Sorry, only enabled services can be shared.");
				}
				else if (service2.url) {
					this.broadcast('showModal', 'ShareModal', {url: service2.url, title: service2.title, context: service2});
				}
				else {
					Utils.error(this, "Sorry, this service has no public URL.");
				}
			});
		}
	}
}
</script>

<style>
.ServicePanel .type {
	text-align: center;
}
.ServicePanel .enabled {
	text-align: center;
}
</style>