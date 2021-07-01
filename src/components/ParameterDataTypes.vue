<template>
	<div class="fieldContainer" v-if="selectedSchema">
		<div class="dataTypeChooser" v-if="showDataTypeChooser">
			<select name="dataType" :value="selectedType" @input="onSelectType" :disabled="!editable">
				<template v-if="groupedAllowedTypes.length > 1">
					<optgroup v-for="group in groupedAllowedTypes" :key="group.name" :label="group.name">
						<option v-for="type in group.types" :key="type.dataType()" :value="type.dataType()">{{ type | dataTypeTitle }}</option>
					</optgroup>
				</template>
				<template v-else>
					<option v-for="type in groupedAllowedTypes[0].types" :key="type.dataType()" :value="type.dataType()">{{ type | dataTypeTitle }}</option>
				</template>
			</select>
		</div>
		<div v-if="!isItem && selectedSchema.description()" class="description">
			<i class="fas fa-info-circle"></i>
			<Description :description="selectedSchema.description()" :compact="true" />
		</div>
		<ParameterDataType :editable="editable" :parameter="parameter" :schema="selectedSchema" v-model="state" :processId="processId" :context="context" @changeType="setSelected" :parent="parent" />
	</div>
</template>

<script>
import Utils from '../utils.js';
import JsonSchema from './jsonSchema.js';
import ParameterDataType from './ParameterDataType.vue';
import Description from '@openeo/vue-components/components/Description.vue';
import EventBusMixin from './EventBusMixin.vue';
import { ProcessParameter, ProcessDataType } from './blocks/processSchema.js';

const API_TYPES = Utils.resolveJsonRefs(require('@openeo/js-processgraphs/assets/subtype-schemas.json')).definitions;
const TYPE_GROUPS = [
	'Basics',
	'References',
	'Spatial',
	'Temporal',
	'File and Folders',
	'Resources',
	'CRS',
	'UDF',
	'Other',
];
const now = () => new Date().toISOString().replace(/\.\d+/, '');
const NATIVE_TYPES = [
	'string',
	'integer',
	'number',
	'boolean',
	'array',
	'object'
];
const SUPPORTED_TYPES = [
		// Native types
		{type: 'null', const: null, group: 'Basics'},
		{type: 'string', default: "", group: 'Basics'},
		{type: 'integer', default: 0, group: 'Basics'},
		{type: 'number', default: 0, group: 'Basics'},
		{type: 'boolean', default: false, group: 'Basics'},
	//	{type: 'array', subtype: 'labeled-array', title: 'Array with labels', group: 'Basics'}, // Can't be transfered between client and server, no JSON encoding available.
		{type: 'array', default: [], group: 'Basics'},
		{type: 'object', default: {}, group: 'Basics'},

		{type: 'string', subtype: 'date-time', format: 'date-time', title: 'Date and Time', group: 'Temporal', default: () => now()},
		{type: 'string', subtype: 'date', format: 'date', title: 'Date only', group: 'Temporal', default: () => now().substring(0, 10)},
		{type: 'string', subtype: 'time', format: 'time', title: 'Time only', group: 'Temporal', default: () => now().substring(11)},
		{type: 'string', subtype: 'year', title: 'Year only', group: 'Temporal'},
		{type: 'array', subtype: 'temporal-interval', title: "Temporal interval", group: 'Temporal'},
		{type: 'array', subtype: 'temporal-intervals', title: "Temporal intervals (multiple)", group: 'Temporal', default: []},

		{type: 'object', subtype: 'geojson', title: 'GeoJSON', group: 'Spatial'},
		{type: 'object', subtype: 'bounding-box', title: 'Bounding Box', group: 'Spatial'},

		{type: 'string', subtype: 'band-name', title: 'Band', group: 'Resources'},
		{type: 'string', subtype: 'collection-id', title: 'Collection', group: 'Resources'},
		{type: 'string', subtype: 'job-id', title: 'Batch Job', group: 'Resources'},

		{type: 'string', subtype: 'udf-code', title: 'UDF Source Code', group: 'UDF', default: ""},
		{type: 'string', subtype: 'udf-runtime', title: 'UDF Runtime', group: 'UDF'},
		{type: 'string', subtype: 'udf-runtime-version', title: 'UDF Runtime Version', group: 'UDF', any: false},

		{type: 'integer', subtype: 'epsg-code', title: 'EPSG Code (CRS)', group: 'CRS'},
		{type: 'string', subtype: 'proj-definition', title: 'PROJ defintiion (CRS)', group: 'CRS', default: ""},
		{type: 'string', subtype: 'wkt2-definition', title: 'WKT2 defintiion (CRS)', group: 'CRS', default: ""},

		{type: 'array', subtype: 'file-path', title: 'File path', group: 'File and Folders'},
		{type: 'array', subtype: 'file-paths', title: 'File paths (multiple)', group: 'File and Folders', default: []},
		{type: 'string', subtype: 'uri', format: 'uri', title: 'URI / URL', group: 'File and Folders'},
		{type: 'string', subtype: 'output-format', title: 'Export file format', group: 'File and Folders'},
		{type: 'object', subtype: 'output-format-options', title: 'Export file format parameters', group: 'File and Folders', any: false},
		{type: 'string', subtype: 'input-format', title: 'Import file format', group: 'File and Folders'},
		{type: 'object', subtype: 'input-format-options', title: 'Import file format parameters', group: 'File and Folders', any: false},

	//	{type: 'array', subtype: 'kernel', title: 'Kernel'},
		{type: 'object', subtype: 'process-graph', title: 'Custom Process'},
		{subtype: 'json', title: 'JSON'},

//		{type: 'object', subtype: 'raster-cube'},
//		{type: 'object', subtype: 'vector-cube'},
];

export default {
	name: 'ParameterDataTypes',
	mixins: [EventBusMixin],
	components: {
		Description,
		ParameterDataType
	},
	props: {
		parameter: {
			type: Object,
			default: () => new ProcessParameter({})
		},
		editable: {
			type: Boolean,
			default: true
		},
		processId: String,
		value: {},
		isItem: {
			type: Boolean,
			default: false
		},
		context: {},
		parent: {}
	},
	data() {
		return {
			state: typeof this.value === 'undefined' ? this.parameter.default : this.value,
			selectedType: null,
			selectedNativeType: null,
			selectedSchema: null,
			jsonSchemaValidator: JsonSchema.create(this.$store)
		};
	},
	filters: {
		dataTypeTitle(type) {
			// Set a human-readable title if none is set
			if (type.schema && !type.schema.title) {
				let supportedType = SUPPORTED_TYPES.find(st => st.subtype === type.schema.subtype || st.type === type.schema.type);
				if (supportedType && supportedType.title) {
					return supportedType.title;
				}
			}

			return type.title();
		}
	},
	async created() {
		await this.detectType();
	},
	computed: {
		refSchemas() {
			let refs = {};
			for(let r of this.parameter.getRefs()) {
				let name;
				if (r.from_node) {
					name = 'from_node:' + r.from_node;
					refs[name] = new ProcessDataType({
						type: 'object',
						group: 'References',
						refId: name,
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
						const: r,
						additionalProperties: false
					});
				}
				else if (r.from_parameter) {
					name = 'from_parameter:' + r.from_parameter;
					refs[name] = new ProcessDataType({
						type: 'object',
						group: 'References',
						refId: name,
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
						const: r,
						additionalProperties: false
					});
				}
			}
			return refs;
		},
		showDataTypeChooser() {
			return Utils.size(this.allowedTypes) >= 2;
		},
		allowedTypes() {
			if (this.parameter.dataType() === 'any') {
				return Object.assign({}, this.supportedTypes, this.refSchemas);
			}
			else {
				let types = {};
				for(let type of this.parameter.schemas) {
					let name = type.dataType();
					types[name] = type;
				}
				return Object.assign(types, this.refSchemas);
			}
		},
		supportedTypes() {
			let map = {};
			for(let s of SUPPORTED_TYPES) {
				if (s.any === false) {
					continue;
				}
				let name = s.subtype || s.type;
				let schema = Object.assign({}, API_TYPES[name], s);
				map[name] = new ProcessDataType(schema, this.parameter);
			}
			return map;
		},
		groupedAllowedTypes() {
			let grouped = {};
			for(let type in this.allowedTypes) {
				let schema = this.allowedTypes[type];
				let group = schema.group();
				if (!Array.isArray(grouped[group])) {
					grouped[group] = [schema];
				}
				else {
					grouped[group].push(schema);
				}
			}
			return TYPE_GROUPS
				.map(group => ({
					name: group,
					types: grouped[group] || []
				}))
				.filter(group => group.types.length !== 0);
		}
	},
	watch: {
		value(value) {
			if (value !== this.state) {
				this.state = value;
			}
		},
		state(value) {
			this.$emit('input', value);
		},
		selectedType(type) {
			this.$emit('schemaSelected', this.supportedTypes[type]);
		}
	},
	methods: {
		/**
		 * Returns the indices of provided JSON Schemas that the provided values matches against.
		 * 
		 * @param {Array} types - Array of JSON schemas
		 * @param {*} value - A value
		 * @return {string[]} - Returns matching indices (as strings!).
		 */
		async getTypeForValue(types, value) {
			var validTypes = [];
			for(var type of types) {
				try {
					var errors = await this.jsonSchemaValidator.validateValue(value, type.schema);
					if (errors.length > 0) {
						continue;
					}
					validTypes.push(type.dataType());
				} catch (error) {}
			}
			return validTypes;
		},
		async detectType() {
			let keys = Object.keys(this.allowedTypes);
			let valueUndefined = typeof this.state === 'undefined';
			if (keys.length === 0) {
				await this.setSelected('json');
			}
			else if (keys.length === 1) {
				await this.setSelected(keys[0], valueUndefined);
			}
			else if (valueUndefined) {
				let nonNullKeys = keys.filter(t => t !== 'null');
				await this.setSelected(nonNullKeys[0], true);
			}
			else {
				let types = await this.getTypeForValue(Object.values(this.allowedTypes), this.state);
				if (types.length === 0) {
					await this.setSelected('json');
				}
				else if (types.length === 1) {
					await this.setSelected(types[0]);
				}
				else {
					// If integer and number are both valid options, always choose number
					if (types.includes('integer') && types.includes('number')) {
						// Remove integer as they overlap and number always works
						types = types.filter(type => type !== 'integer');
					}

					if (!Utils.isRef(this.state) && types.length > 1) {
						console.warn("A parameter is ambiguous. Potential types: " + types.join(', ') + ". Value: " + JSON.stringify(this.state));
					}
		
					// If multiple types have been detected and a native one is included, fall back to the native one
					let index = types.findIndex(type => NATIVE_TYPES.includes(type)) || 0;
					await this.setSelected(types[index]);
				}
			}
		},
		async onSelectType(evt) {
			await this.setSelected(evt.target.value, true);
		},
		async setSelected(type, setValue = false) {
			let nativeType = type;
			if (type instanceof ProcessDataType) {
				this.selectedSchema = type;
				this.selectedType = type.dataType();
				nativeType = type.nativeDataType();
			}
			else {
				this.selectedSchema = this.allowedTypes[type] ? this.allowedTypes[type] : this.supportedTypes[type];
				this.selectedType = type;
			}

			if (setValue) {
				// Convert string to numbers and vice versa
				if (typeof this.state === 'number' && nativeType === 'string') {
					this.state = String(this.state);
				}
				else if (typeof this.state === 'string' && nativeType === 'integer') {
					if (this.state.match(/^([+-]?\d+)$/)) {
						let num = Number.parseInt(this.state, 10);
						if (!Number.isNaN(num)) {
							this.state = num;
						}
					}
				}
				else if (typeof this.state === 'string' && nativeType === 'number') {
					let num = Number.parseFloat(this.state);
					if (!Number.isNaN(num)) {
						this.state = num;
					}
				}

				// Special handling for null as it doesn't have an actual input element
				if (this.selectedSchema.isNull()) {
					this.state = null;
				}
				// Set const value
				else if (typeof this.selectedSchema.const !== 'undefined') {
					this.state = this.selectedSchema.const;
				}
				// Set single enum value
				else if (this.selectedSchema.isEnum() && this.selectedSchema.getEnumChoices().length === 1) {
					this.state = this.selectedSchema.getEnumChoices()[0];
				}
				// Set value from default value
				else {
					let defaultValue = this.selectedSchema.default();
					try {
						if (typeof this.state === 'undefined' || (await this.jsonSchemaValidator.validateValue(this.state, this.selectedSchema)).length > 0) {
							this.state = defaultValue;
						}
					}
					catch (error) {
						this.state = defaultValue;
					}
				}
			}
		}
	}
};
</script>

<style>
.fieldContainer .description {
	display: flex;
	align-items: center;
	font-size: 0.9em;
	margin-bottom: 10px;
}
.fieldContainer .description .fas {
	margin-right: 0.5em;
}
.fieldContainer .dataTypeChooser {
	margin-bottom: 10px;
}
</style>
