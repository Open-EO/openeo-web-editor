<template>
	<div class="datatypeEditor fileFormatOptionsEditor">
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
			The selected file format has no further options.
		</template>
	</div>
</template>

<script>
import ParameterFields from '../ParameterFields.vue';
import Utils from '../../utils.js';
import Field from '../blocks/field';
import Description from '@openeo/vue-components/components/Description.vue';

export default {
	name: 'FileFormatOptionsEditor',
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
		},
		type: {
			type: String
		}
	},
	data() {
		return {
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
			var fields = {};
			// Convert to Fields
			for (var name in this.fileFormat.parameters) {
				var p = this.fileFormat.parameters[name];
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
				fields[name] = new Field(name, name, schema, undefined, p.description, !!p.required);
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
			return Utils.isObject(this.fileFormat) && Utils.isObject(this.fileFormat.parameters) && Object.keys(this.fileFormat.parameters).length > 0;
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
.fileFormatOptionsEditor {
	width: 100%;
}
</style>