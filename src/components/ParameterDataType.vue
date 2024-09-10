<template>
	<div class="fieldEditorContainer">
		<!-- Result Node -->
		<template v-if="isResult">
			<div class="fieldValue externalData fromNode">
				<span>Output of <code>#{{ state.from_node }}</code></span>
			</div>
			<button type="button" v-if="nativeParameterType === 'array'" @click="convertToArray()"><i class="fas fa-list"></i> Convert to array</button>
		</template>
		<div v-else-if="type === 'raster-cube' || type === 'vector-cube' || type === 'datacube'" class="fieldValue description">
			<i class="fas fa-exclamation-circle"></i>
			<p>This parameter can only be set by creating a connection between an "Output" / "Result" and this parameter in the Visual Model.</p>
		</div>
		<!-- Process Parameter -->
		<template v-else-if="isPgParameter">
			<div class="fieldValue externalData fromArgument">
				<span>Value of process parameter <code>{{ state.from_parameter }}</code></span>
			</div>
			<button type="button" v-if="nativeParameterType === 'array'" @click="convertToArray()"><i class="fas fa-list"></i> Convert to array</button>
		</template>
		<!-- Undefined -->
		<div class="description" v-else-if="type === 'undefined'">
			<i class="fas fa-info-circle"></i>
			<p>No value is set.</p>
		</div>
		<!-- Null -->
		<div class="description" v-else-if="type === 'null'">
			<i class="fas fa-info-circle"></i>
			<p>This is set to <strong><code>null</code></strong>, which is usually used as placeholder for no-data values or a default value.</p>
		</div>
		<!-- Select Boxes (collection id, job id, epsg code, in/output format, service type, billing plan, enums) -->
		<SelectBox v-else-if="isSelection" v-model="state" :key="type" :type="type" :editable="editable" :schema="schema" :context="dependency" :openDirection="type === 'band-name' ? 'below' : 'auto'" @onDetails="onSelectDetails"></SelectBox>
		<!-- Temporal (date, time, date-time, temporal-interval) -->
		<TemporalPicker v-else-if="isTemporal" v-model="state" :key="type" :type="type" :editable="editable"></TemporalPicker>
		<!-- Bounding Box -->
		<MapAreaSelect v-else-if="type === 'bounding-box'" v-model="state" :key="type" :editable="editable" class="areaSelector"></MapAreaSelect>
		<!-- GeoJSON -->
		<GeoJsonEditor v-else-if="type === 'geojson'" v-model="state" :key="type" :editable="editable" class="geoJsonEditor"></GeoJsonEditor>
		<!-- Process Editor -->
		<Editor v-else-if="type === 'process-graph'" class="callbackEditor" :editable="editable" :parent="parent" :parentSchema="schema" :showDiscoveryToolbar="true" v-model="state" :defaultValue="editorDefaultValue" />
		<!-- Output format options -->
		<FileFormatOptionsEditor v-else-if="type === 'output-format-options' || type === 'input-format-options'" ref="fileFormatOptionsEditor" :type="type" v-model="state" :format="dependency"></FileFormatOptionsEditor>
		<!-- Budget -->
		<Budget v-else-if="type === 'budget'" v-model="state" :editable="editable" />
		<!-- Budget -->
		<Duration v-else-if="type === 'duration'" v-model="state" :editable="editable" />
		<!-- Budget -->
		<Kernel v-else-if="type === 'kernel'" v-model="state" :editable="editable" />
		<!-- UDF-Code -->
		<TextEditor class="fieldValue textarea" v-else-if="type === 'udf-code'" :id="name" :editable="editable" v-model="state" :language="dependency" />
		<!-- CommonMark -->
		<TextEditor class="fieldValue textarea" v-else-if="type === 'commonmark'" :id="name" :editable="editable" v-model="state" language="markdown" />
		<!-- WKT / PROJ -->
		<TextEditor class="fieldValue textarea" v-else-if="type === 'wkt2-definition' || type === 'proj-definition'" :id="name" :editable="editable" v-model="state" />
		<!-- JSON -->
		<TextEditor class="fieldValue textarea" v-else-if="type == 'json'" :id="name" :editable="editable" v-model="state" language="json" />
		<!-- Boolean -->
		<input class="fieldValue" v-else-if="type === 'boolean'" v-model="state" type="checkbox" :name="name" :disabled="!editable" />
		<!-- Integer / Number -->
		<input class="fieldValue" v-else-if="type === 'integer' || type === 'number'" v-model.number="state" type="number" :min="numericMin" :max="numericMax" :step="numericStep" :name="name" :disabled="!editable" />
		<!-- URL -->
		<input class="fieldValue" v-else-if="type === 'url' || type === 'uri'" v-model="state" type="url" :name="name" :disabled="!editable" />
		<!-- Objects / Arrays -->
		<ObjectEditor  v-else-if="nativeType === 'object' || nativeType === 'array'" :key="type" :editable="editable" :parameter="parameter" :schema="schema" :isObject="nativeType === 'object'" v-model="state" :parent="parent" :context="context" />
		<!-- String and all other -->
		<input class="fieldValue" v-else v-model="state" type="text" :name="name" :disabled="!editable" />
	</div>
</template>

<script>
import EventBusMixin from './EventBusMixin.js';

import ObjectEditor from './datatypes/ObjectEditor.vue';
import Budget from './datatypes/Budget.vue';
import MapAreaSelect from './maps/MapAreaSelect.vue';
import GeoJsonEditor from './datatypes/GeoJsonEditor.vue';
import TextEditor from './TextEditor.vue';

import Utils from '../utils';
import Process from '../process';

export default {
	name: 'ParameterDataType',
	mixins: [EventBusMixin],
	components: {
		ObjectEditor,
		Budget,
		MapAreaSelect,
		GeoJsonEditor,
		TextEditor,
		// Asynchronously load the following components to avoid circular references.
		// See https://vuejs.org/v2/guide/components-edge-cases.html#Circular-References-Between-Components
		Editor: () => import('./Editor.vue'),
		FileFormatOptionsEditor: () => import('./datatypes/FileFormatOptionsEditor.vue'),
		ParameterDataTypes: () => import('./ParameterDataTypes.vue'),
		// Async loading for smaller starting bundle,
		Duration: () => import('./datatypes/Duration.vue'),
		Kernel: () => import('./datatypes/Kernel.vue'),
		SelectBox: () => import('./datatypes/SelectBox.vue'),
		TemporalPicker: () => import('./datatypes/TemporalPicker.vue')
	},
	props: {
		parameter: Object,
		editable: {
			type: Boolean,
			default: true
		},
		schema: Object,
		value: {},
		context: {},
		parent: {}
	},
	data() {
		return {
			state: this.value
		};
	},
	computed: {
		type() {
			return this.schema.dataType();
		},
		nativeType() {
			return this.schema.nativeDataType();
		},
		nativeParameterType() {
			return this.parameter.nativeDataType();
		},
		editorDefaultValue() {
			if (this.type === 'process-graph') {
				if (typeof this.parameter.default !== 'undefined') {
					return this.parameter.default;
				}
				else if (this.parameter.nullable()) {
					return null;
				}
			}
			return undefined;
		},
		isTemporal() {
			return (this.type === 'date' || this.type === 'time' || this.type === 'date-time' || this.type === 'temporal-interval' || this.type === 'year');
		},
		isSelection() {
			switch(this.type) {
				case 'collection-id':
				case 'job-id':
				case 'file-path':
				case 'file-paths':
				case 'epsg-code':
				case 'input-format':
				case 'openeo-datatype':
				case 'output-format':
				case 'service-type':
				case 'billing-plan':
				case 'udf-runtime':
				case 'udf-runtime-version':
					return true;
				case 'band-name':
					return !!this.dependency;
				default:
					return this.schema.isEnum();
			}
		},
		name() {
			return this.parameter.name + (Array.isArray(this.parameter.value) ? '[]' : '');
		},
		isResult() {
			return Boolean(Utils.isObject(this.state) && this.state.from_node && Utils.size(this.state) === 1 && this.schema.schema.isRef);
		},
		isPgParameter() {
			return Boolean(Utils.isObject(this.state) && this.state.from_parameter && Utils.size(this.state) === 1 && this.schema.schema.isRef);
		},
		numericMin() {
			if (typeof this.schema.minimum === 'number') {
				return this.schema.minimum;
			}
			return ""; // Empty seems to be the default for the input element
		},
		numericMax() {
			if (typeof this.schema.maximum === 'number') {
				return this.schema.maximum;
			}
			return ""; // Empty seems to be the default for the input element
		},
		numericStep() {
			if (typeof this.schema.multipleOf === 'number') {
				return this.schema.multipleOf;
			}
			else if (this.type === 'integer') {
				return 1;
			}
			else {
				return 'any';
			}
		},
		newValue() {
			if (this.type === 'number') {
				var num = Number.parseFloat(this.state);
				return Number.isNaN(num) ? null : num;
			}
			else if (this.type === 'integer') {
				var num = Number.parseInt(this.state);
				return Number.isNaN(num) ? null : num;
			}
			else if (this.type === 'null') {
				return null;
			}
			else if (typeof this.state === 'string' && this.state.length > 0 && (this.type === 'any' || this.type === 'mixed')) {
				// Try to guess whether it is a number or not
				var num = Number(this.state);
				return Number.isNaN(num) ? this.state : num;
			}
			else {
				return this.state;
			}
		},
		dependency() {
			switch(this.type) {
				case 'output-format-options':
				case 'input-format-options':
					return this.getValueFromOtherParameterByDataType(this.type.replace('-options', ''));
				case 'udf-runtime-version':
				case 'udf-code':
					return this.getValueFromOtherParameterByDataType('udf-runtime');
				case 'band-name':
					return this.getValueFromOtherParameterByDataType('collection-id');
				case 'array':
					if (Process.arrayOf(this.schema) === 'band-name') {
						return this.getValueFromOtherParameterByDataType('collection-id');
					}
				default:
					return undefined;
			}
		}
	},
	watch: {
		value(newVal) {
			if (newVal !== this.newValue) {
				this.state = this.value;
			}
		},
		newValue(newVal) {
			this.$emit('input', newVal);
		},
		dependency(newVal, oldVal) {
			if (typeof oldVal !== 'undefined' && newVal !== oldVal) {
				this.$emit('reset');
			}
		}
	},
	methods: {
		getValueFromOtherParameterByDataType(dataType) {
			if (!Utils.isObject(this.context) || !Utils.isObject(this.context.schemas) || !Utils.isObject(this.context.values)) {
				return;
			}
			for(let name in this.context.schemas) {
				let schema = this.context.schemas[name];
				if (Utils.isObject(schema) && schema.dataType() === dataType) {
					return this.context.values[name];
				}
			}
			return;
		},
		convertToArray() {
			this.state = [this.state];
			this.$emit('input', this.state);
			this.$emit('changeType', 'array');
		},
		onSelectDetails() {
			if (this.type === 'collection-id') {
				this.broadcast('showCollection', this.state);
			}
		}
	}
};
</script>

<style scoped>
.areaSelector, .geoJsonEditor {
	height: 500px;
	flex-grow: 1;
}
.textarea {
	width: 100%;
	height: 250px;
}
.externalData span {
	display: inline-block; 
	background-color: #ddd;
	padding: 2px 5px;
	border-radius: 3px;
}
.externalData tt {
	font-size: 1.1em;
	font-weight: bold;
}
.callbackEditor {
	height: 450px;
	min-width: 50px;
	width: 100%;
}
</style>
