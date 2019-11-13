<template>
	<div class="fieldContainer" v-if="selectedType !== null">
		<div class="dataTypeChooser" v-if="allowedSchemas.length > 1">
			<select name="dataType" v-model="selectedType" :disabled="!editable">
				<option v-for="(ref, i) in nonActiveRefs.refs" :value="'refInput!' + JSON.stringify(ref)" :key="i + '_refs'">Output of {{ ref.from_node}}</option>
				<option v-for="(ref, i) in nonActiveRefs.callbackRefs" :value="'refInput!' + JSON.stringify(ref)" :key="i + '_callbackRefs'">Value of callback argument {{ ref.from_argument}}</option>
				<option v-for="(schema, type) in allowedSchemas" :key="type" :value="type">{{ schema.title() }}</option>
			</select>
		</div>
		<div v-if="typeof selectedType === 'String' && !selectedType.includes('refInput!') && allowedSchemas[selectedType].description()" class="description">
			<i class="fas fa-info-circle"></i> {{ allowedSchemas[selectedType].description() }}
		</div>
		<ParameterField ref="field" :uid="uid" :editable="editable" :field="field" :schema="selectedSchema" :pass="passToChild" :processId="processId" :isObjectItem="isObjectItem" />
	</div>
</template>

<script>
import Utils from '../utils.js';
import ParameterField from './ParameterField.vue';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import { JsonSchemaValidator } from '@openeo/js-commons';
import { ProcessSchema } from '../processSchema.js';

const SUPPORTED_TYPES = new ProcessSchema({
	anyOf: [
		{type: 'null'},
		{type: 'string'},
		{type: 'number'},
		{type: 'integer'},
		{type: 'array'},
		{type: 'object'},
		{type: 'string', format: 'band-name'},
		{type: 'object', format: 'bounding-box'},
		{type: 'object', format: 'callback'},
		{type: 'string', format: 'collection-id'},
		{type: 'string', format: 'date'},
		{type: 'string', format: 'date-time'},
		{type: 'integer', format: 'epsg-code'},
		{type: 'object', format: 'geojson'},
		{type: 'string', format: 'job-id'},
	//	{type: 'array', format: 'kernel'},
		{type: 'string', format: 'output-format'},
		{type: 'string', format: 'process-graph-id'},
		{type: 'string', format: 'proj-definition'},
		{type: 'array', format: 'temporal-interval'},
		{type: 'array', format: 'temporal-intervals'},
		{type: 'string', format: 'time'}
	]
});

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
		uid: String,
		useAny: {
			type: Boolean,
			default: false
		},
		isObjectItem: {
			type: Boolean,
			default: false
		},
		nonActiveValue: null
	},
	data() {
		return {
			selectedType: null
		};
	},
	created() {
		if (this.field.schemas.length > 1) {
			JsonSchemaValidator.getTypeForValue(this.field.schemas.map(s => s.schema), this.pass)
				.then((evalType) => {
					this.setSelectedEvalType(evalType, true);
				})
				.catch(error => this.guessType());
		}
		else if(this.useAny && SUPPORTED_TYPES){
			//TODO: optimize JsonSchemaValidator getTypeForValue to get less evalTypes
			JsonSchemaValidator.getTypeForValue(SUPPORTED_TYPES.schemas.map(s => s.schema), this.pass)
				.then((evalType) => {
					let isObjectType = evalType === '5' || (Array.isArray(evalType) && evalType.includes('5'));
					let isOutput = this.pass.hasOwnProperty('from_node') || this.pass.hasOwnProperty('from_argument');
					if(isObjectType && isOutput){
						this.setSelectedOutputType();
					}
					else{
						this.setSelectedEvalType(evalType, false);
					}
				}).catch(error => this.guessType());
		}
		else {
			this.setSelectedType(0);
		}
	},
	computed: {
		allowedSchemas() {
			var type = this.field.dataType();
			if (type === 'any' || this.useAny) {
				return SUPPORTED_TYPES.schemas;
			}
			else {
				return this.field.schemas;
			}
		},
		selectedSchema() {
			if(typeof this.selectedType !== 'string' || !this.selectedType.includes('refInput!')){
				return this.allowedSchemas[this.selectedType];
			}
			else{
				//TODO: Better way to always return simple object schema
				return this.allowedSchemas[5];
			}
		},
		passToChild() {
			if(typeof this.selectedType !== 'string' || !this.selectedType.includes('refInput!')){
				//return empty object if user changed from ref input to another selected type
				if(typeof this.pass === 'object' && this.pass != null && this.useAny && (this.pass.from_node || this.pass.from_argument)){
					return {};
				}
				return this.pass;
			}
			else{
				let selectedInput = this.selectedType.split('!')[1];
				let parsedInput = JSON.parse(selectedInput);
				return parsedInput;
			}
		},
		nonActiveRefs() {
			return (typeof this.nonActiveValue === 'undefined' || !this.nonActiveValue) ? {} : this.nonActiveValue;
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
		setSelectedEvalType(evalType, displayInfo){
			if (typeof evalType === 'undefined') {
				this.guessType();
			}
			else if (Array.isArray(evalType)) {
				if(displayInfo)
					Utils.info(this, "Data type can't be detected, please select it yourself.");
				console.warn("Parameter schema is ambiguous. Potential types: " + evalType.join(', ') + ". Value: " + JSON.stringify(this.pass));
				this.setSelectedType(evalType[0]);
			}
			else {
				this.setSelectedType(evalType);
			}
		},
		setSelectedOutputType() {
			let seletectedOutputRef = this.pass.from_node ? {'from_node' : this.pass.from_node} : {'from_argument': this.pass.from_argument};
			let selectedOutputVal = 'refInput!' + JSON.stringify(seletectedOutputRef);
			this.setSelectedType(selectedOutputVal);
		},
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
		},
		getNonActiveValue() {
			return this.$refs.field.getNonActiveValue();
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
