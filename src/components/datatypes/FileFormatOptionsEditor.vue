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
				<ParameterDataTypes :uid="uid" :ref="parameter.name" :editable="editable" :spec="parameter" v-model="options[parameter.name]" />
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
			options: this.value,
			uid: '_' + Utils.getUniqueId(),
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
				var p = this.fileFormat.parameters[name];
				var schema = {};
				if (typeof p.type !== 'undefined') {
					schema.type = [p.type, "null"];
				}
				if (typeof p.minimum !== 'undefined') {
					schema.minimum = p.minimum;
				}
				if (typeof p.maximum !== 'undefined') {
					schema.maximum = p.maximum;
				} 
				if (Array.isArray(p.enum)) {
					schema.enum = p.enum;
				}
				if (typeof p.example !== 'undefined') {
					schema.examples = [p.example];
				}
				parameters.push({
					name: name,
					description: p.description,
					schema: schema,
					optional: !p.required,
					default: p.default
				});
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