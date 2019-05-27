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
			<button title="Edit metadata" @click="editMetadata(p.row)" v-show="supports('updateService')"><i class="fas fa-edit"></i></button>
			<button title="Replace process graph" @click="replaceProcessGraph(p.row)" v-show="supports('updateService')"><i class="fas fa-retweet"></i></button>
			<button title="Delete" @click="deleteService(p.row)" v-show="supports('deleteService')"><i class="fas fa-trash"></i></button>
			<button v-show="p.row.enabled" title="View on map" @click="viewService(p.row)"><i class="fas fa-map"></i></button>
		</template>
	</DataTable>
</template>

<script>
import EventBus from '../eventbus.js';
import WorkPanelMixin from './WorkPanelMixin.vue';
import Utils from '../utils.js';
import Field from './blocks/field';

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
		getTitleField() {
			return new Field('title', 'Title', {type: 'string'});
		},
		getDescriptionField() {
			return new Field('description', 'Description', {type: 'string', format: 'commonmark'}, 'CommonMark (Markdown) is allowed.');
		},
		getServiceTypeField() {
			return new Field('type', 'Type', {type: 'string', format: 'service-type'}, '', true);
		},
		getBillingPlanField() {
			return new Field('plan', 'Billing plan', {type: 'string', format: 'billing-plan'});
		},
		getBudgetField() {
			return new Field('budget', 'Budget', {type: 'number', format: 'budget', default: null});
		},
		getEnabledField() {
			return new Field('enabled', 'Enabled', {type: 'boolean', default: true});
		},
		getParametersField() {
			return new Field('parameters', 'Parameters', {type: 'object', format: 'service-type-parameters'});
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
			if (typeof data.parameters !== 'undefined' && !Utils.isObject(data.parameters)) {
				data.parameters = {};
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
			this.connection.createService(script, data.type, data.title, data.description, data.enabled, data.parameters, data.plan, data.budget)
				.then(service => {
					EventBus.$emit('serviceCreated', service);
				}).catch(error => {
					Utils.exception(this, error, 'Sorry, could not create the web service.');
				});
		},
		createServiceFromScript() {
			EventBus.$emit('getProcessGraph', script => {
				var fields = [
					this.getServiceTypeField(),
					this.getTitleField(),
					this.getDescriptionField(),
					this.getEnabledField(),
					this.getBillingPlanField(),
					this.getBudgetField(),
					this.getParametersField()
				];
				EventBus.$emit('showDataForm', "Create new web service", fields, data => this.createService(script, data));
			});
		},
		editMetadata(oldService) {
			this.refreshService(oldService, service => {
				var fields = [
					this.getTitleField().setValue(service.title),
					this.getDescriptionField().setValue(service.description),
					this.getEnabledField().setValue(service.enabled),
					this.getBillingPlanField().setValue(service.plan),
					this.getBudgetField().setValue(service.budget),
					this.getParametersField().setValue(service.parameters)
				];
				EventBus.$emit('showDataForm', "Edit web service", fields, data => this.updateService(service, data));
			});
		},
		serviceInfo(service) {
			this.refreshService(service, updatedService => {
				EventBus.$emit('showServiceInfo', updatedService.getAll());
			});
		},
		replaceProcessGraph(service) {
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
			this.updateService(service, {title: newTitle});
		},
		toggleEnabled(service) {
			this.updateService(service, {enabled: !service.enabled});
		},
		updateService(service, data) {
			data = this.normalizeToDefaultData(data);
			service.updateService(data)
				.then(updatedService => {
					Utils.ok(this, "Service successfully updated web service.");
					this.updateServiceData(updatedService);
				})
				.catch(error => Utils.exception(this, error, "Sorry, could not update web service."));
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
			EventBus.$emit('showWebService', service);
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