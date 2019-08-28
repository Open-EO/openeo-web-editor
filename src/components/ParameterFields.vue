<template>
	<div class="fieldContainer" v-if="selectedType !== null">
		<div class="dataTypeChooser" v-if="field.schemas.length > 1">
			<select name="dataType" v-model="selectedType" :disabled="!editable">
				<option v-for="(schema, type) in field.schemas" :key="type" :value="type">{{ schema.title() }}</option>
			</select>
		</div>
		<div v-if="field.schemas[selectedType].description()" class="description">
			<i class="fas fa-info-circle"></i> {{ field.schemas[selectedType].description() }}
		</div>
		<ParameterField ref="field" :uid="uid" :editable="editable" :field="field" :schema="field.schemas[selectedType]" :pass="pass" :processId="processId" />
	</div>
</template>

<script>
import ParameterField from './ParameterField.vue';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import { JsonSchemaValidator } from '@openeo/js-commons';

export default {
	name: 'ParameterFields',
	mixins: [EventBusMixin],
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
		pass: {},
		uid: String
	},
	data() {
		return {
			selectedType: null
		};
	},
	created() {
		if (this.field.schemas.length > 1) {
			JsonSchemaValidator.getTypeForValue(this.field.schemas.map(s => s.schema), this.pass)
				.then(evalType => {
					if (typeof evalType === 'undefined') {
						this.guessType();
					}
					else if (Array.isArray(evalType)) {
						Utils.info("Data type can't be detected, please select it yourself.");
						console.warn("Parameter schema is ambiguous. Potential types: " + evalType.join(', ') + ". Value: " + JSON.stringify(this.pass));
						this.setSelectedType(evalType[0]);
					}
					else {
						this.setSelectedType(evalType);
					}
				})
				.catch(error => this.guessType());
		}
		else {
			this.setSelectedType(0);
		}
	},
	watch: {
		type(newType, oldType) {
			if (this.uid) {
				this.emit('processParameterTypeChanged', this.uid, this.processId, this.field, newType, oldType);
			}
		}
	},
	methods: {
		setSelectedType(type) {
			this.selectedType = String(type);
		},
		guessType() {
			// Try to set null as default
			for(var i in this.field.schemas) {
				if (this.field.schemas[i].isNull()) {
					this.setSelectedType(i);
					return;
				}
			}
			// Otherwise set first type in list
			this.setSelectedType(0);
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
	margin-bottom: 10px;
}
.dataTypeChooser {
	margin-bottom: 10px;
}
</style>
