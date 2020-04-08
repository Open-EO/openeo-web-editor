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

const SUPPORTED_TYPES = new ProcessSchema([
		{type: 'null'},
		{type: 'string'},
		{type: 'number'},
		{type: 'integer'},
		{type: 'boolean'},
		{type: 'array'},
	//	{type: 'array', subtype: 'labeled-array', title: 'Array with labels'},
		{type: 'object'},

		{type: 'string', subtype: 'date', format: 'date', title: 'Date only'},
		{type: 'string', subtype: 'date-time', format: 'date-time', title: 'Date and Time'},
		{type: 'string', subtype: 'time', format: 'time', title: 'Time only'},
		{type: 'array', subtype: 'temporal-interval', title: "Temporal interval"},
		{type: 'array', subtype: 'temporal-intervals', title: "Temporal intervals (multiple)"},

		{type: 'string', subtype: 'band-name', title: 'Band'},
		{type: 'object', subtype: 'bounding-box', title: 'Bounding Box'},
		{type: 'string', subtype: 'collection-id', title: 'Collection'},
		{type: 'object', subtype: 'geojson', title: 'GeoJSON'},
		{type: 'string', subtype: 'job-id', title: 'Batch Job'},
	//	{type: 'array', subtype: 'kernel', title: 'Kernel'},
		{type: 'object', subtype: 'process-graph', title: 'Custom Process'},
	//	{type: 'string', subtype: 'uri', format: 'uri', title: 'URI / URL'},

	//	{type: 'array', subtype: 'file-path', title: 'File path'},
	//	{type: 'array', subtype: 'file-paths', title: 'File paths (multiple)'},

	//	{type: 'string', subtype: 'udf-code', title: 'UDF Source Code'},
	//	{type: 'string', subtype: 'udf-runtime', title: 'UDF Runtime'},
	//	{type: 'string', subtype: 'udf-runtime-version', title: 'UDF Runtime Version'},

		{type: 'integer', subtype: 'epsg-code', title: 'EPSG Code (CRS)'},
		{type: 'string', subtype: 'proj-definition', title: 'PROJ defintiion (CRS)'},
	//	{type: 'string', subtype: 'wkt2-definition', title: 'WKT2 defintiion (CRS)'},

		{type: 'string', subtype: 'output-format', title: 'Export file format'},
	//	{type: 'object', subtype: 'output-format-options', title: 'Export file format parameters'},
		{type: 'string', subtype: 'input-format', title: 'Import file format'},
	//	{type: 'object', subtype: 'input-format-options', title: 'Import file format parameters'},

	//	{type: 'object', subtype: 'raster-cube'},
	//	{type: 'object', subtype: 'vector-cube'},
]);

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
