<template>
	<div class="fieldContainer" v-if="selectedSchema">
		<div class="dataTypeChooser" v-if="showDataTypeChooser">
			<select name="dataType" :value="selectedType" @input="onSelectType" :disabled="!editable">
				<template v-if="selectableTypes.length > 1">
					<optgroup v-for="group in selectableTypes" :key="group.name" :label="group.name">
						<option v-for="(type, key) in group.types" :key="key" :value="key">{{ type | dataTypeTitle }}</option>
					</optgroup>
				</template>
				<template v-else>
					<option v-for="(type, key) in selectableTypes[0].types" :key="key" :value="key">{{ type | dataTypeTitle }}</option>
				</template>
			</select>
		</div>
		<div v-if="!isItem && selectedSchema.description()" class="description">
			<i class="fas fa-info-circle"></i>
			<Description :description="selectedSchema.description()" :compact="true" />
		</div>
		<ParameterDataType :editable="editable" :parameter="parameter" :schema="selectedSchema" v-model="state" :context="context" @changeType="setSelected" @reset="resetValue" :parent="parent" />
	</div>
</template>

<script>
import Utils from '../utils.js';
import JsonSchema from './jsonSchema.js';
import ParameterDataType from './ParameterDataType.vue';
import Description from '@openeo/vue-components/components/Description.vue';
import EventBusMixin from './EventBusMixin.js';
import { ProcessDataType, ProcessParameter } from '@openeo/js-commons';
import { API_TYPES, NATIVE_TYPES } from './datatypes/api';

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
const cloneDefault = value => {
	if (value && typeof value === 'object') {
		return Utils.deepClone(value);
	}
	return value;
};
const now = () => new Date().toISOString().replace(/\.\d+/, '');
const SUPPORTED_TYPES = [
		// Native types
		{subtype: 'undefined', title: 'No Value', const: undefined, not: {}, group: 'Basics'},
		{type: 'null', const: null, group: 'Basics'},
		{type: 'string', default: "", group: 'Basics'},
		{type: 'integer', default: 0, group: 'Basics'},
		{type: 'number', default: 0, group: 'Basics'},
		{type: 'boolean', default: false, group: 'Basics'},
	//	{type: 'array', subtype: 'labeled-array', title: 'Array with labels', group: 'Basics'}, // Can't be transfered between client and server, no JSON encoding available.
		{type: 'array', default: [], group: 'Basics'},
		{type: 'object', default: {}, group: 'Basics', properties: {
			from_node: { not: {} },
			from_parameter: { not: {} }
		}, default: {}},

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

	//	{type: 'array', subtype: 'kernel', title: 'Kernel'}, // ToDo
		{type: 'object', subtype: 'process-graph', title: 'Custom Process'},
		{tyoe: 'object', subtype: 'json-schema', title: 'Data Type (JSON Schema)', any: false},
		{subtype: 'json', title: 'JSON', noAutoDetect: true},

// Can't be transfered between client and server, no JSON encoding available for cubes:
//		{type: 'object', subtype: 'raster-cube'},
//		{type: 'object', subtype: 'vector-cube'},
//		{type: 'object', subtype: 'datacube'},
];
const refSchema = {
	type: 'object',
	additionalProperties: false,
	properties: {
		from_node: {
			type: 'string'
		},
		from_parameter: {
			type: 'string'
		}
	}
};

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
			state: undefined,
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
			if (!Array.isArray(this.parameter.refs)) {
				return {};
			}
			let refs = {};
			for(let r of this.parameter.refs) {
				let name;
				if (r.from_node) {
					name = 'from_node:' + r.from_node;
					refs[name] = new ProcessDataType({
						type: 'object',
						group: 'References',
						subtype: name,
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
						default: r,
						additionalProperties: false
					});
				}
				else if (r.from_parameter) {
					name = 'from_parameter:' + r.from_parameter;
					refs[name] = new ProcessDataType({
						type: 'object',
						group: 'References',
						subtype: name,
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
						default: r,
						additionalProperties: false
					});
				}
			}
			return refs;
		},
		showDataTypeChooser() {
			return Utils.size(this.allowedTypes) > 1;
		},
		allowedTypes() {
			let allowed = {};
			if (this.parameter.dataType() === 'any') {
				Object.assign(allowed, this.supportedTypes);
			}
			else {
				for(let type of this.parameter.schemas) {
					const name = this.getUniqueKey(allowed, type.dataType());
					allowed[name] = type;
				}
			}
			Object.assign(allowed, this.refSchemas);
			return allowed;
		},
		supportedTypes() {
			let map = {};
			for(let s of SUPPORTED_TYPES) {
				if (s.any === false) {
					continue;
				}
				const name = s.subtype || s.type;
				const schema = Object.assign({}, API_TYPES[name], s);
				map[name] = new ProcessDataType(schema, this.parameter);
			}
			return map;
		},
		selectableTypes() {
			let grouped = {};
			for(let type in this.allowedTypes) {
				let schema = this.allowedTypes[type];
				let group = schema.group();
				if (!Utils.isObject(grouped[group])) {
					grouped[group] = {};
				}
				grouped[group][type] = schema;
			}
			let groups = TYPE_GROUPS
				.map(group => ({
					name: group,
					types: grouped[group] || []
				}))
				.filter(group => group.types.length !== 0);
			return groups;
		},
		detectableTypes() {
			const detectable = {};
			for(let key in this.allowedTypes) {
				let type = this.allowedTypes[key];
				if (!type.schema.noAutoDetect) {
					detectable[key] = type;
				}
			}
			return detectable;
		}
	},
	watch: {
		value: {
			immediate: true,
			handler(value) {
				if (typeof this.state === 'undefined' || value !== this.state) {
					if (typeof value === 'undefined' && !this.allowedTypes.undefined) {
						this.state = cloneDefault(this.parameter.default);
					}
					else {
						this.state = value;
					}
				}
			}
		},
		state: {
			deep: true,
			handler(value) {
				this.$emit('input', value);
			}
		},
		selectedType(type) {
			this.$emit('schemaSelected', this.supportedTypes[type]);
		}
	},
	methods: {
		getUniqueKey(obj, basename) {
			let name = basename;
			let index = 2;
			while (obj[name]) {
				name = basename + String(index);
				index++;
			}
			return name;
		},
		async isValueInvalid(value, schema) {
			let schema2 = Utils.deepClone(schema);
			// Allow from_node and from_parameter in values, see https://github.com/Open-EO/openeo-web-editor/issues/179
			if (schema2.type === 'array' && Utils.isObject(schema2.items)) {
				schema2.items = {
					oneOf: [
						schema2.items,
						refSchema
					]
				};
			}
			let errors = await this.jsonSchemaValidator.validateValue(value, schema2);
			return errors.length > 0;
		},
		/**
		 * Returns the indices of provided JSON Schemas that the provided values matches against.
		 * 
		 * @param {Array} types - Array of JSON schemas
		 * @param {*} value - A value
		 * @return {string[]} - Returns matching indices (as strings!).
		 */
		async getTypeForValue(types, value) {
			const validTypes = [];
			for(let key in types) {
				let type = types[key];
				try {
					if (await this.isValueInvalid(value, type.schema)) {
						continue;
					}
					validTypes.push(key);
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
				if (this.allowedTypes.undefined) {
					await this.setSelected(this.allowedTypes.undefined, false);
				}
				else {
					let nonNullKeys = keys.filter(t => t !== 'null');
					await this.setSelected(nonNullKeys[0], true);
				}
			}
			else {
				let types = await this.getTypeForValue(this.detectableTypes, this.state);
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
					let index = types.findIndex(type => NATIVE_TYPES.includes(type));
					// If not even a native one is available, choose the first one
					if (index === -1) {
						index = 0;
					}
					await this.setSelected(types[index]);
				}
			}
		},
		async onSelectType(evt) {
			await this.setSelected(evt.target.value, true);
		},
		resetValue() {
			this.state = cloneDefault(this.parameter.default);
			this.detectType();
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
					let defaultValue = cloneDefault(this.selectedSchema.default());
					try {
						if (typeof this.state === 'undefined' || await this.isValueInvalid(this.state, this.selectedSchema)) {
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

<style lang="scss">
.fieldContainer {
 	.description {
		display: flex;
		align-items: center;
		font-size: 0.9em;
		margin-bottom: 10px;

		.fas {
			margin-right: 0.5em;
		}
		p {
			margin: 0;
		}
	}
	.dataTypeChooser {
		margin-bottom: 10px;
	}
}
</style>
