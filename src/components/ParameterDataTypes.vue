<template>
	<div class="fieldContainer" v-if="selectedType !== null">
		<div class="dataTypeChooser" v-if="allowedSchemas.length > 1">
			<select name="dataType" :value="selectedType" @input="onSelectType" :disabled="!editable">
				<option v-for="(schema, type) in allowedSchemas" :key="type" :value="type">{{ schema.title() }}</option>
			</select>
		</div>
		<div v-if="!isItem && selectedSchema.description()" class="description">
			<i class="fas fa-info-circle"></i>
			<Description :description="selectedSchema.description()" :compact="true" />
		</div>
		<ParameterDataType ref="editor" :uid="uid" :editable="editable" :parameter="parameter" :schema="selectedSchema" v-model="state" :processId="processId" @changeType="changeType" />
	</div>
</template>

<script>
import Utils from '../utils.js';
import JsonSchema from './jsonSchema.js';
import ParameterDataType from './ParameterDataType.vue';
import Description from '@openeo/vue-components/components/Description.vue';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import { ProcessGraphNode } from '@openeo/js-processgraphs';
import { ProcessParameter, ProcessDataType } from './blocks/processSchema.js';

const API_TYPES = Utils.resolveJsonRefs(require('@openeo/js-processgraphs/assets/openeo-api/subtype-schemas.json')).definitions;

const now = () => new Date().toISOString().replace(/\.\d+/, '');
const SUPPORTED_TYPES = [
		// Native types
		{type: 'null', default: null},
		{type: 'string', default: ""},
		{type: 'integer', default: 0},
		{type: 'number', default: 0},
		{type: 'boolean', default: false},
	//	{type: 'array', subtype: 'labeled-array', title: 'Array with labels'},
		{type: 'array', default: []},
		{type: 'object', default: {}},

		// temporal types
		{type: 'string', subtype: 'date-time', format: 'date-time', title: 'Date and Time', default: () => now()},
		{type: 'string', subtype: 'date', format: 'date', title: 'Date only', default: () => now().substring(0, 10)},
		{type: 'string', subtype: 'time', format: 'time', title: 'Time only', default: () => now().substring(11)},
	//	{type: 'string', subtype: 'year', title: 'Year only'}, ToDo: Implemented, but only available after rc.2, wait until release
		{type: 'array', subtype: 'temporal-interval', title: "Temporal interval"},
		{type: 'array', subtype: 'temporal-intervals', title: "Temporal intervals (multiple)", default: []},

		// Other types
		{type: 'string', subtype: 'band-name', title: 'Band'},
		{type: 'object', subtype: 'bounding-box', title: 'Bounding Box'},
		{type: 'string', subtype: 'collection-id', title: 'Collection'},
		{type: 'object', subtype: 'geojson', title: 'GeoJSON'},
		{type: 'string', subtype: 'job-id', title: 'Batch Job'},
	//	{type: 'array', subtype: 'kernel', title: 'Kernel'},
		{type: 'object', subtype: 'process-graph', title: 'Custom Process'},
		{type: 'string', subtype: 'uri', format: 'uri', title: 'URI / URL'},

		{type: 'array', subtype: 'file-path', title: 'File path'},
		{type: 'array', subtype: 'file-paths', title: 'File paths (multiple)', default: []},

	//	{type: 'string', subtype: 'udf-code', title: 'UDF Source Code'},
	//	{type: 'string', subtype: 'udf-runtime', title: 'UDF Runtime'},
	//	{type: 'string', subtype: 'udf-runtime-version', title: 'UDF Runtime Version'},

		{type: 'integer', subtype: 'epsg-code', title: 'EPSG Code (CRS)'},
		{type: 'string', subtype: 'proj-definition', title: 'PROJ defintiion (CRS)', default: ""},
		{type: 'string', subtype: 'wkt2-definition', title: 'WKT2 defintiion (CRS)', default: ""},

		{type: 'string', subtype: 'output-format', title: 'Export file format'},
	//	{type: 'object', subtype: 'output-format-options', title: 'Export file format parameters'},
		{type: 'string', subtype: 'input-format', title: 'Import file format'},
	//	{type: 'object', subtype: 'input-format-options', title: 'Import file format parameters'},

	//	{type: 'object', subtype: 'raster-cube'},
	//	{type: 'object', subtype: 'vector-cube'},
];

export default {
	name: 'ParameterDataTypes',
	mixins: [EventBusMixin],
	components: {
		Description,
		ParameterDataType
	},
	props: {
		spec: {
			type: Object,
			default: () => ({})
		},
		editable: {
			type: Boolean,
			default: true
		},
		processId: String,
		value: {},
		uid: String,
		isItem: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			state: this.value,
			selectedType: null,
			jsonSchemaValidator: JsonSchema.create(this.$store)
		};
	},
	async created() {
		if (this.allowedSchemas.length > 1) {
			try {
				let types = await this.jsonSchemaValidator.getTypeForValue(this.allowedSchemas.map(s => s.schema), this.value);
				switch(types.length) {
					case 0:
						this.guessType();
						break;
					case 1:
						this.setSelectedType(types[0]);
						break;
					default:
						let typeNames = evalType.map(t => this.allowedSchemas[t].dataType()).sort();
						// Ignore if number/integer was detected as they always overlap and number always works
						let numerics = typeNames.length === 2 && typeNames[0] === 'integer' && typeNames[1] === 'number';
						if (!Utils.isRef(this.value) && !numerics) {
							console.warn("A parameter is ambiguous. Potential types: " + typeNames.join(', ') + ". Value: " + JSON.stringify(this.value));
						}
						this.setSelectedType(types[0]);
				}
			}
			catch(error) {
				console.warn(error);
				this.guessType();
			}
		}
		else {
			this.setSelectedType(0);
		}
	},
	computed: {
		parameter() {
			return new ProcessParameter(this.spec);
		},
		refSchemas() {
			return ProcessGraphNode.getValueRefs(this.state)
				.map(r => {
					if (r.from_node) {
						return new ProcessDataType({
							type: 'object',
							isRef: 'from_node',
							from_node: r.from_node,
							title: 'Output of #' + r.from_node,
							required: ["from_node"],
							properties: {
								from_node: {
									type: "string",
									const: r.from_node
								}
							},
							additionalProperties: false
						});
					}
					else if (r.from_parameter) {
						return new ProcessDataType({
							type: 'object',
							isRef: 'from_parameter',
							from_parameter: r.from_parameter,
							title: 'Value of process parameter "' + r.from_parameter + '"',
							required: ["from_parameter"],
							properties: {
								from_parameter: {
									type: "string",
									const: r.from_parameter
								}
							},
							additionalProperties: false
						});
					}
					else {
						return null;
					}
				})
				.filter(r => r !== null);
		},
		allowedSchemas() {
			var type = this.parameter.dataType();
			if (type === 'any') {
				return this.refSchemas.concat(this.supportedTypes);
			}
			else {
				return this.refSchemas.concat(this.parameter.schemas);
			}
		},
		supportedTypes() {
			return SUPPORTED_TYPES.map(s => {
				let name = s.subtype || s.type;
				return new ProcessDataType(
					Object.assign({}, API_TYPES[name], s)
				)
			});
		},
		selectedSchema() {
			return this.allowedSchemas[this.selectedType];
		}
	},
	watch: {
		type(newType, oldType) {
			if (this.uid) {
				this.emit('processParameterTypeChanged', this.uid, this.processId, this.parameter, newType, oldType);
			}
		},
		value(value) {
			if (value !== this.state) {
				this.state = value;
			}
		},
		state(value) {
			this.$emit('input', value);
		}
	},
	methods: {
		async onSelectType(evt) {
			let selectedSchema = this.allowedSchemas[evt.target.value];
			let defaultValue = selectedSchema.default();
			try {
				if ((await this.jsonSchemaValidator.validateValue(defaultValue, selectedSchema)).length > 0) {
					this.state = defaultValue;
				}
			}
			catch (error) {
				this.state = defaultValue;
			}
			await this.$nextTick();
			this.selectedType = evt.target.value;
		},
		changeType(type) {
			for(var i in this.allowedSchemas) {
				let schema = this.allowedSchemas[i];
				if (schema.dataType() === type) {
					this.setSelectedType(i);
					return;
				}
			}
		},
		setSelectedType(type) {
			this.selectedType = String(type);
		},
		guessType() {
			// Try to set null as default
			for(var i in this.allowedSchemas) {
				if (this.allowedSchemas[i].isNull()) {
					this.setSelectedType(i);
					return;
				}
			}
			// Otherwise set first type in list
			this.setSelectedType(0);
		}
	}
};
</script>

<style scoped>
.description {
	display: flex;
	align-items: center;
	font-size: 0.9em;
	margin-bottom: 10px;
}
.description .fas {
	margin-right: 0.5em;
}
.dataTypeChooser {
	margin-bottom: 10px;
}
</style>
