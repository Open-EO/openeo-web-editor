<template>
	<div class="datatypeEditor serviceConfigEditor">
		<template v-if="hasOptions">
			<div class="fieldRow" v-for="parameter in parameters" :key="parameter.name">
				<label class="fieldLabel">
					{{ parameter.label }}<strong class="required" v-if="!parameter.optional" title="required">*</strong>
					<div v-if="parameter.description" class="description">
						<Description :description="parameter.description" />
					</div>
				</label>
				<ParameterDataTypes :ref="parameter.name" :editable="editable" :parameter="parameter" v-model="options[parameter.name]" />
			</div>
		</template>
		<template v-else-if="serviceType">
			The selected service type has no configuration options.
		</template>
		<template v-else>
			Please select a service type first.
		</template>
	</div>
</template>

<script>
import ParameterDataTypes from '../ParameterDataTypes.vue';
import Utils from '../../utils.js';
import Description from '@openeo/vue-components/components/Description.vue';
import { ProcessParameter, ProcessDataType } from '@openeo/js-commons';

export default {
	name: 'ServiceConfigEditor',
	components: {
		Description,
		ParameterDataTypes
	},
	props: {
		value: {
			type: Object,
			default: () => ({})
		},
		serviceType: {
			type: String
		},
		editable: {
			type: Boolean,
			default: true
		}
	},
	data() {
		return {
			options: Utils.isObject(this.value) ? this.value : {}
		};
	},
	computed: {
		...Utils.mapState(['serviceTypes']),
		service() {
			if (typeof this.serviceType !== 'string' || !Utils.isObject(this.serviceTypes)) {
				return null;
			}
			return this.serviceTypes[this.serviceType.toUpperCase()] || null;
		},
		parameters() {
			const parameters = [];
			// Convert the configuration parameters of the service type to fields
			for (const name in this.service.configuration) {
				const schema = Object.assign({}, this.service.configuration[name]);
				if (typeof schema.example !== 'undefined') {
					schema.examples = [schema.example];
					delete schema.example;
				}
				const parameter = new ProcessParameter({
					name: name,
					description: schema.description,
					schema,
					optional: !schema.required,
					default: schema.default
				});
				parameter.schemas.push(new ProcessDataType({subtype: 'undefined', not: {}}, parameter));
				parameter.label = Utils.prettifyString(name);
				parameters.push(parameter);
			}
			return parameters;
		},
		hasOptions() {
			return Utils.isObject(this.service) && Utils.isObject(this.service.configuration) && Object.keys(this.service.configuration).length > 0;
		}
	},
	watch: {
		options: {
			deep: true,
			handler(newValue) {
				this.$emit('input', newValue);
			}
		},
		value(newValue) {
			if (this.options !== newValue) {
				this.options = Utils.isObject(newValue) ? newValue : {};
			}
		}
	}
};
</script>

<style scoped>
.serviceConfigEditor {
	width: 100%;
}
</style>
