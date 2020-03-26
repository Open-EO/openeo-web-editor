<template>
	<div class="fieldContainer" v-if="selectedType !== null">
		<div class="dataTypeChooser" v-if="allowedSchemas.length > 1">
			<select name="dataType" v-model="selectedType" :disabled="!editable">
				<option v-for="(schema, type) in allowedSchemas" :key="type" :value="type">{{ schema.title() }}</option>
			</select>
		</div>
		<div v-if="allowedSchemas[selectedType].description()" class="description">
			<i class="fas fa-info-circle"></i> {{ allowedSchemas[selectedType].description() }}
		</div>
		<ParameterField ref="field" :uid="uid" :editable="editable" :field="field" :schema="selectedSchema" :pass="pass" :processId="processId" :isObjectItem="isObjectItem" />
	</div>
</template>

<script>
import Utils from '../utils.js';
import ParameterField from './ParameterField.vue';
import Field from './blocks/field.js';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import { JsonSchemaValidator } from '@openeo/js-processgraphs';
import { ProcessSchema, ProcessSubSchema } from '../processSchema.js';

const SUPPORTED_TYPES = new ProcessSchema({
	anyOf: [
		{type: 'null'},
		{type: 'string'},
		{type: 'number'},
		{type: 'integer'},
		{type: 'boolean'},
		{type: 'array'},
		{type: 'object'},
		{type: 'string', subtype: 'band-name'},
		{type: 'object', subtype: 'bounding-box'},
		{type: 'string', subtype: 'collection-id'},
		{type: 'string', subtype: 'date', format: 'date'},
		{type: 'string', subtype: 'date-time', format: 'date-time'},
		{type: 'integer', subtype: 'epsg-code'},
	//	{type: 'array', subtype: 'file-path'},
	//	{type: 'array', subtype: 'file-paths'},
		{type: 'object', subtype: 'geojson'},
		{type: 'string', subtype: 'input-format'},
	//	{type: 'object', subtype: 'input-format-options'},
		{type: 'string', subtype: 'job-id'},
	//	{type: 'array', subtype: 'kernel'},
	//	{type: 'array', subtype: 'labeled-array'},
		{type: 'string', subtype: 'output-format'},
	//	{type: 'object', subtype: 'output-format-options'},
		{type: 'object', subtype: 'process-graph'},
		{type: 'string', subtype: 'proj-definition'},
	//	{type: 'object', subtype: 'raster-cube'},
		{type: 'array', subtype: 'temporal-interval'},
		{type: 'array', subtype: 'temporal-intervals'},
		{type: 'string', subtype: 'time', format: 'time'},
	//	{type: 'string', subtype: 'udf-code'},
	//	{type: 'string', subtype: 'udf-runtime'},
	//	{type: 'string', subtype: 'udf-runtime-version'},
	//	{type: 'string', subtype: 'uri', format: 'uri'},
	//	{type: 'object', subtype: 'vextor-cube'},
	//	{type: 'string', subtype: 'wkt2-definition'}
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
		}
	},
	data() {
		return {
			selectedType: null,
			jsonSchemaValidator: new JsonSchemaValidator()
		};
	},
	created() {
		if (this.allowedSchemas.length > 1) {
			this.jsonSchemaValidator.getTypeForValue(this.allowedSchemas.map(s => s.schema), this.pass)
				.then(evalType => {
					if (typeof evalType === 'undefined') {
						this.guessType();
					}
					else if (Array.isArray(evalType)) {
						if (!Field.isRef(this.pass)) {
							if (!this.isObjectItem) {
								Utils.info(this, "Data type can't be detected, please select it yourself.");
							}
							console.warn("Parameter schema is ambiguous. Potential types: " + evalType.join(', ') + ". Value: " + JSON.stringify(this.pass));
						}
						this.setSelectedType(evalType[0]);
					}
					else {
						this.setSelectedType(evalType);
					}
				})
				.catch(error => {
					console.warn(error);
					this.guessType()
				});
		}
		else {
			this.setSelectedType(0);
		}
	},
	computed: {
		allowedSchemas() {
			var schemas = [].concat(
				this.refs.from_node.map(n => new ProcessSubSchema({
					type: 'object',
					isRef: 'from_node',
					from_node: n,
					title: 'Output of #' + n,
					required: ["from_node"],
					properties: {
						from_node: {
							type: "string",
							const: n
						}
					},
					additionalProperties: false
				})),
				this.refs.from_parameter.map(a => new ProcessSubSchema({
					type: 'object',
					isRef: 'from_parameter',
					from_parameter: a,
					title: 'Value of process parameter "' + a + '"',
					required: ["from_parameter"],
					properties: {
						from_parameter: {
							type: "string",
							const: a
						}
					},
					additionalProperties: false
				})),
			);
			var type = this.field.dataType();
			if (type === 'any' || this.useAny) {
				return schemas.concat(SUPPORTED_TYPES.schemas);
			}
			else {
				return schemas.concat(this.field.schemas);
			}
		},
		selectedSchema() {
			return this.allowedSchemas[this.selectedType];
		},
		refs() {
			return this.field.getRefs();
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
