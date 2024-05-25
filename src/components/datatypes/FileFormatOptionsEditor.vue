<template>
	<div class="datatypeEditor fileFormatOptionsEditor">
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
		<template v-else>
			The selected file format has no further options.
		</template>
	</div>
</template>

<script>
import ParameterDataTypes from '../ParameterDataTypes.vue';
import Utils from '../../utils.js';
import Description from '@openeo/vue-components/components/Description.vue';
import { ProcessParameter, ProcessDataType } from '@openeo/js-commons';

export default {
	name: 'FileFormatOptionsEditor',
	components: {
		Description,
		ParameterDataTypes
	},
	props: {
		value: {
			type: Object,
			default: () => ({})
		},
		format: {
			type: String
		},
		editable: {
			type: Boolean,
			default: true
		},
		type: {
			type: String
		}
	},
	data() {
		return {
			options: this.value
		};
	},
	computed: {
		...Utils.mapState(['fileFormats']),
		fileFormat() {
			if (this.type === 'input-format-options') {
				return this.fileFormats.getInputType(this.format);
			}
			else {
				return this.fileFormats.getOutputType(this.format);
			}
		},
		parameters() {
			var parameters = [];
			// Convert to Fields
			for (var name in this.fileFormat.parameters) {
				var schema = Object.assign({}, this.fileFormat.parameters[name]);
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
				parameters.push(parameter);
			}
			return parameters;
		},
		hasOptions() {
			if (typeof this.format !== 'string') {
				return false;
			}
			return Utils.isObject(this.fileFormat) && Utils.isObject(this.fileFormat.parameters) && Object.keys(this.fileFormat.parameters).length > 0;
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
				this.options = newValue;
			}
		}
	}
};
</script>

<style scoped>
.fileFormatOptionsEditor {
	width: 100%;
}
</style>