<template>
	<DataTable ref="table" :data="data" :columns="columns" class="ServicePanel">
		<template slot="toolbar">
			<button title="Add new service" @click="createServiceFromScript()" v-show="supportsCreate" :disabled="!this.hasProcess"><i class="fas fa-plus"></i> Create</button>
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
import EventBusMixin from './EventBusMixin.vue';
import WorkPanelMixin from './WorkPanelMixin';
import Utils from '../utils';
import { Service } from '@openeo/js-client';

export default {
	name: 'ServicePanel',
	mixins: [WorkPanelMixin('services', 'web service', 'web services'), EventBusMixin],
	data() {
		return {
			columns: {
				id: {
					name: 'ID',
					primaryKey: true,
					hide: true
				},
				title: {
					name: 'Web Service',
					computedValue: row => Utils.getResourceTitle(row),
					format: value => Utils.formatIdOrTitle(value),
					edit: this.updateTitle
				},
				type: {
					name: 'Type',
					format: value => typeof value === 'string' ? value.toUpperCase() : value,
				},
				enabled: {
					name: 'Enabled',
					edit: this.toggleEnabled
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
			}
		};
	},
	computed: {
		...Utils.mapState('editor', ['process']),
		...Utils.mapGetters('editor', ['hasProcess']),
		...Utils.mapState(['serviceTypes']),
		...Utils.mapGetters(['supports', 'supportsBilling', 'supportsBillingPlans']),
		canShare() {
			return Array.isArray(this.$config.supportedBatchJobSharingServices) && this.$config.supportedBatchJobSharingServices.length > 0;
		},
		supportsDebug() {
			return this.supports('debugService');
		}
	},
	mounted() {
		this.listen('replaceProcess', this.replaceProcess);
	},
	methods: {
		isMapServiceSupported(type) {
			return Utils.isMapServiceSupported(type);
		},
		showInEditor(service) {
			this.refreshElement(service, updatedService => this.emit('editProcess', updatedService));
		},
		showLogs(service) {
			this.emit('viewLogs', service);
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
		async createService(script, data) {
			data = this.normalizeToDefaultData(data);
			try {
				let service = await this.create({parameters: [script, data.type, data.title, data.description, data.enabled, data.configuration, data.plan, data.budget]});
				this.serviceCreated(service);
			} catch(error) {
				Utils.exception(this, error, 'Create Service Error: ' + (data.title || ''));
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
			this.emit('showDataForm', "Create new web service", fields, data => this.createService(this.process, data));
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
				this.emit('showDataForm', "Edit web service", fields, data => this.updateService(service, data));
			});
		},
		serviceInfo(service) {
			this.refreshElement(service, updatedService => {
				this.emit('showModal', 'ServiceInfoModal', {service: updatedService.getAll()});
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
		async deleteService(service) {
			if (!confirm(`Do you really want to delete the service "${Utils.getResourceTitle(service)}"?`)) {
				return;
			}
			try {
				await this.delete({data: service});
				this.emit('removeWebService', service.id);
			} catch(error) {
				Utils.exception(this, error, 'Delete Service Error: ' + Utils.getResourceTitle(service));
			}
		},
		viewService(service) {
			this.emit('viewWebService', service);
		},
		async shareResults(service) {
			if (this.canShare) {
				this.refreshElement(service, service2 => {
					if (!service.enabled) {
						Utils.error(this, "Sorry, only enabled services can be shared.");
					}
					else if (service2.url) {
						this.emit('showModal', 'ShareModal', {url: service2.url, title: service2.title, context: service2});
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