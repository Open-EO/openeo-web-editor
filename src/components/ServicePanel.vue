<template>
	<DataTable ref="table" :data="data" :columns="columns" id="ServicePanel">
		<template slot="toolbar">
			<button title="Add new service" @click="createServiceFromScript()" v-show="supportsCreate"><i class="fas fa-plus"></i> Create</button>
		</template>
		<template slot="enabled" slot-scope="p">
			<span class="boolean">
				<span v-show="p.row.enabled === true"><i class="fas fa-check-circle"></i></span>
				<span v-show="p.row.enabled === false"><i class="fas fa-times-circle"></i></span>
				<span v-show="typeof p.row.enabled !== 'boolean'"><i class="fas fa-question-circle"></i></span>
			</span>
		</template>
		<template slot="actions" slot-scope="p">
			<button title="Details" @click="serviceInfo(p.row)" v-show="supportsRead"><i class="fas fa-info"></i></button>
			<button title="Edit metadata" @click="editMetadata(p.row)" v-show="supportsUpdate"><i class="fas fa-edit"></i></button>
			<button title="Edit process" @click="showInEditor(p.row)" v-show="supportsRead"><i class="fas fa-code-branch"></i></button>
			<button title="Delete" @click="deleteService(p.row)" v-show="supportsDelete"><i class="fas fa-trash"></i></button>
			<button v-show="p.row.enabled && isMapServiceSupported(p.row.type)" title="View on map" @click="viewService(p.row)"><i class="fas fa-map"></i></button>
		</template>
	</DataTable>
</template>

<script>
import Config from '../../config';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import WorkPanelMixin from './WorkPanelMixin';
import Utils from '../utils';
import { Service } from '@openeo/js-client';

export default {
	name: 'ServicePanel',
	mixins: [WorkPanelMixin('services', 'web service', 'web services'), EventBusMixin],
	computed: {
		...Utils.mapState(['serviceTypes']),
		...Utils.mapGetters(['supportsBilling', 'supportsBillingPlans'])
	},
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
					computedValue: row => Utils.getResourceTitle(row),
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
	mounted() {
		this.listen('replaceProcess', this.replaceProcess);
	},
	methods: {
		isMapServiceSupported(mapType) {
			if (typeof mapType !== 'string') {
				return false;
			}
			return Config.supportedMapServices.includes(mapType.toLowerCase());
		},
		showInEditor(service) {
			this.refreshElement(service, updatedService => this.emit('editProcess', updatedService));
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
				value: value
			};
		},
		getDescriptionField(value = null) {
			return {
				name: 'description',
				label: 'Description',
				schema: {type: 'string', subtype: 'commonmark'},
				default: null,
				value: value,
				description: 'CommonMark (Markdown) is allowed.'
			};
		},
		getServiceTypeField(value = undefined) {
			return {
				name: 'type',
				label: 'Type',
				schema: {type: 'string', subtype: 'service-type'},
				value: value,
				optional: false
			};
		},
		getBillingPlanField(value = undefined) {
			return {
				name: 'plan',
				label: 'Billing plan',
				schema: {type: 'string', subtype: 'billing-plan'},
				value: value
			};
		},
		getBudgetField(value = null) {
			return {
				name: 'budget',
				label: 'Budget',
				schema: {type: 'number', subtype: 'budget'},
				default: null,
				value: value
			};
		},
		getEnabledField(value = true) {
			return {
				name: 'enabled',
				label: 'Enabled',
				schema: {type: 'boolean'},
				default: true,
				value: value
			};
		},
		getConfigField(value = undefined) {
			return {
				name: 'configuration',
				label: 'Service Configuration',
				schema: {type: 'object', subtype: 'service-config'},
				value: value
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
		createService(script, data) {
			data = this.normalizeToDefaultData(data);
			this.create({parameters: [script, data.type, data.title, data.description, data.enabled, data.configuration, data.plan, data.budget]})
				.then(service => this.serviceCreated(service))
				.catch(error => Utils.exception(this, error, 'Creating service failed'));
		},
		createServiceFromScript() {
			this.emit('getCustomProcess', script => {
				var fields = [
					this.getServiceTypeField(),
					this.getTitleField(),
					this.getDescriptionField(),
					this.getEnabledField(),
					this.supportsBillingPlans ? this.getBillingPlanField() : null,
					this.supportsBilling ? this.getBudgetField() : null,
					this.getConfigField()
				];
				this.emit('showDataForm', "Create new web service", fields, data => this.createService(script, data));
			});
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
				this.emit('showServiceInfo', updatedService.getAll());
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
		updateService(service, parameters) {
			this.update({data: service, parameters: this.normalizeToDefaultData(parameters)})
				.catch(error => Utils.exception(this, error, "Updating service failed"));
		},
		deleteService(service) {
			this.delete({data: service})
				.then(() => this.emit('removeWebService', service.id))
				.catch(error => Utils.exception(this, error, 'Sorry, could not delete service.'));
		},
		viewService(service) {
			Utils.info(this, 'Requesting tiles from server. Please wait...');
			this.emit('viewWebService', service);
		}
	}
}
</script>

<style>
#ServicePanel .id {
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