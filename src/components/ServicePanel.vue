<template>
	<DataTable ref="table" :data="data" :columns="columns" class="ServicePanel">
		<template slot="toolbar">
			<button title="Add new permanently stored web service" @click="createServiceFromScript()" v-show="supportsCreate" :disabled="!this.hasProcess"><i class="fas fa-plus"></i> Create</button>
			<button title="Quickly show the process on map without storing it permanently" @click="quickViewServiceFromScript()" v-show="supportsQuickView" :disabled="!this.hasProcess"><i class="fas fa-map"></i> Show on Map</button>
			<SyncButton name="web services" :sync="() => updateData(true)" />
		</template>
		<template #actions="p">
			<button title="Details" @click="serviceInfo(p.row)" v-show="supportsRead"><i class="fas fa-info"></i></button>
			<button title="Edit metadata" @click="editMetadata(p.row)" v-show="supportsUpdate"><i class="fas fa-edit"></i></button>
			<button title="Edit process" @click="showInEditor(p.row)" v-show="supportsRead"><i class="fas fa-project-diagram"></i></button>
			<button title="Delete" @click="deleteService(p.row)" v-show="supportsDelete"><i class="fas fa-trash"></i></button>
			<button v-show="p.row.enabled && isMapServiceSupported(p.row.type)" title="View on map" @click="viewService(p.row)"><i class="fas fa-map"></i></button>
			<button title="Export / Share" @click="shareResults(p.row)" v-show="p.row.enabled && canShare"><i class="fas fa-share"></i></button>
			<button title="View logs" @click="showLogs(p.row)" v-show="supportsDebug"><i class="fas fa-bug"></i></button>
		</template>
	</DataTable>
</template>

<script>
import EventBusMixin from './EventBusMixin';
import WorkPanelMixin from './WorkPanelMixin';
import SyncButton from './SyncButton.vue';
import Utils from '../utils';
import { Service } from '@openeo/js-client';
import { mapMutations } from 'vuex';

export default {
	name: 'ServicePanel',
	mixins: [WorkPanelMixin('services', 'web service', 'web services'), EventBusMixin],
	components: {
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
					edit: this.supportsUpdate ? this.updateTitle : null
				},
				type: {
					name: 'Type',
					format: value => typeof value === 'string' ? value.toUpperCase() : value,
				},
				enabled: {
					name: 'Enabled',
					edit: this.supportsUpdate ? this.toggleEnabled : null
				},
				created: {
					name: 'Submitted',
					format: 'Timestamp',
					sort: 'desc'
				},
				actions: {
					name: 'Actions',
					filterable: false,
					sort: false
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
		showInEditor(service) {
			this.refreshElement(service, updatedService => this.broadcast('editProcess', updatedService));
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
		getTitleField(value = null) {
			return {
				name: 'title',
				label: 'Title',
				schema: {type: 'string'},
				default: null,
				value: value,
				optional: true
			};
		},
		getDescriptionField(value = null) {
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
		getServiceTypeField(value = undefined) {
			return {
				name: 'type',
				label: 'Type',
				schema: {type: 'string', subtype: 'service-type'},
				value: value
			};
		},
		getBillingPlanField(value = undefined) {
			return {
				name: 'plan',
				label: 'Billing plan',
				schema: {type: 'string', subtype: 'billing-plan'},
				value: value,
				optional: true
			};
		},
		getBudgetField(value = null) {
			return {
				name: 'budget',
				label: 'Budget',
				schema: {type: 'number', subtype: 'budget'},
				default: null,
				value: value,
				optional: true
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
				let service = await this.create({parameters: [script, data.type, data.title, data.description, data.enabled, data.configuration, data.plan, data.budget]});
				if (!quiet) {
					this.serviceCreated(service);
				}
				return service;
			} catch(error) {
				Utils.exception(this, error, 'Create Service Error: ' + (data.title || ''));
				return null;
			}
		},
		createServiceFromScript() {
			var fields = [
				this.getTitleField(),
				this.getDescriptionField(),
				this.getServiceTypeField(),
				this.getEnabledField(),
				this.supportsBillingPlans ? this.getBillingPlanField() : null,
				this.supportsBilling ? this.getBudgetField() : null,
				this.getConfigField()
			];
			this.broadcast('showDataForm', "Create new web service", fields, data => this.createService(this.process, data));
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
		editMetadata(oldService) {
			this.refreshElement(oldService, service => {
				var fields = [
					this.getTitleField(service.title),
					this.getDescriptionField(service.description),
					this.getEnabledField(service.enabled),
					this.supportsBillingPlans ? this.getBillingPlanField(service.plan) : null,
					this.supportsBilling ? this.getBudgetField(service.budget) : null,
					this.getConfigField(service.configuration)
				];
				this.broadcast('showDataForm', "Edit web service", fields, data => this.updateService(service, data));
			});
		},
		serviceInfo(service) {
			this.refreshElement(service, updatedService => {
				this.broadcast('showModal', 'ServiceInfoModal', {service: updatedService.getAll()});
			});
		},
		replaceProcess(service, process) {
			if (service instanceof Service) {
				this.updateService(service, {process: process});
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
			} catch(error) {
				if (quiet) {
					console.error(error);
				}
				else {
					Utils.exception(this, error, 'Delete Service Error: ' + Utils.getResourceTitle(service));
				}
			}
		},
		viewService(service, onClose = null) {
			this.broadcast('viewWebService', service, onClose);
		},
		async shareResults(service) {
			if (this.canShare) {
				this.refreshElement(service, service2 => {
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
}
</script>

<style>
.ServicePanel .title {
	width: 25%;
}
.ServicePanel .type {
	text-align: center;
}
.ServicePanel .enabled {
	text-align: center;
}
</style>