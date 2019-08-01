<template>
	<div class="fieldContainer" v-if="type !== null">
		<div class="dataTypeChooser" v-if="field.schemas.length > 1">
			Data type:
			<select name="dataType" v-model="type" :disabled="!editable">
				<option v-for="(schema, key) in field.schemas" :key="key" :value="key">{{ schema.title() }}</option>
			</select>
			<div v-if="field.schemas[type].description()" class="description">
				<i class="fas fa-info-circle"></i> {{ field.schemas[type].description() }}
			</div>
		</div>
		<ParameterField ref="field" :editable="editable" :field="field" :schema="field.schemas[type]" :pass="pass" :processId="processId" />
	</div>
</template>

<script>
import ParameterField from './ParameterField.vue';
import { JsonSchemaValidator } from '@openeo/js-commons';

export default {
	name: 'ParameterFields',
	components: {
		ParameterField
	},
	props: {
		field: Object,
		editable: {
			type: Boolean,
			default: true
		},
		processId: String,
		pass: {}
	},
	data() {
		return {
			type: null
		};
	},
	created() {
		if (this.field.schemas.length > 1) {
			JsonSchemaValidator.getTypeForValue(this.field.schemas.map(s => s.schema), this.pass)
				.then(type => {
					if (typeof type === 'undefined') {
						this.guessType();
					}
					else if (Array.isArray(type)) {
						Utils.info("Data type can't be detected, please select it yourself.");
						console.warn("Parameter schema is ambiguous. Potential types: " + type.join(', ') + ". Value: " + JSON.stringify(this.pass));
						this.type = type[0];
					}
					else {
						this.type = type;
					}
				})
				.catch(error => this.guessType());
		}
		else {
			this.type = 0;
		}
	},
	methods: {
		guessType() {
			// Try to set null as default
			for(var i in this.field.schemas) {
				if (this.field.schemas[i].isNull()) {
					this.type = i;
					return;
				}
			}
			// Otherwise set first type in list
			this.type = 0;
		},
		getValue() {
			return this.$refs.field.getValue();
		}
	}
};
</script>

<style scoped>
.description {
	font-size: 0.9em;
	margin-top: 0.5em;
}
.dataTypeChooser {
	margin-bottom: 1em;
}
</style>
