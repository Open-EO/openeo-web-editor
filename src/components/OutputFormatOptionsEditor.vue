<template>
	<div class="outputFormatOptionsEditor">
		<template v-if="hasOptions">
			<div class="fieldRow" v-for="(field, name) in parameters" :key="name">
				<label class="fieldLabel">
					{{ field.label }}<strong class="required" v-if="field.isRequired" title="required">*</strong>
					<div v-if="field.description" class="description">
						<Description :description="field.description" />
					</div>
				</label>
				<ParameterFields :uid="uid" :ref="field.name" :editable="editable" :field="field" :pass="field.getValue()" />
			</div>
		</template>
		<template v-else>
			The selected output format has no further options.
		</template>
	</div>
</template>

<script>
import ParameterFields from './ParameterFields.vue';
import Utils from '../utils.js';
import Field from './blocks/field';
import Description from '@openeo/vue-components/components/Description.vue';

export default {
	name: 'OutputFormatOptionsEditor',
	components: {
		Description,
		ParameterFields
	},
	props: {
		value: {},
		format: {
			type: String
		},
		editable: {
			type: Boolean,
			default: true
		}
	},
	data() {
		return {
			uid: '_' + Math.random().toString(36).substr(2, 9),
		};
	},
	computed: {
		...Utils.mapState('server', ['outputFormats']),
		parameters() {
			var format = this.format.toUpperCase();
			var fields = {};
			// Convert to Fields
			for (var name in this.outputFormats[format].parameters) {
				var p = this.outputFormats[format].parameters[name];
				var schema = {};
				if (typeof p.type !== 'undefined') {
					schema.type = [p.type, "null"];
				}
				if (typeof p.default !== 'undefined') {
					schema.default = p.default;
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
				fields[name] = new Field(name, name, schema, p.description, !!p.required);
				if (Utils.isObject(this.value) && typeof this.value[name] !== 'undefined') {
					fields[name].setValue(this.value[name]);
				}
			}
			return fields;
		},
		hasOptions() {
			if (typeof this.format !== 'string') {
				return false;
			}
			var format = this.format.toUpperCase();
			return Utils.isObject(this.outputFormats) && Utils.isObject(this.outputFormats[format]) && Utils.isObject(this.outputFormats[format].parameters) && Object.keys(this.outputFormats[format].parameters).length > 0;
		}
	},
	methods: {
		getValue() {
			var options = {};
			for(var i in this.$refs) {
				if (Array.isArray(this.$refs[i]) && this.$refs[i].length > 0 && Utils.isObject(this.$refs[i][0]) && typeof this.$refs[i][0].getValue == 'function') {
					options[i] = this.$refs[i][0].getValue();
				}
			}
			return options;
		},
/*		updateValue() {
			this.$emit('input', this.getValue());
		} */
	}
};
</script>

<style scoped>
.outputFormatOptionsEditor {
	width: 100%;
}
</style>