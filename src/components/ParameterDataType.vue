<template>
	<div class="fieldEditorContainer">
		<!-- Result Node -->
		<template v-if="isResult">
			<div class="fieldValue externalData fromNode">
				<span>Output of <tt>#{{ state.from_node }}</tt></span>
			</div>
			<button type="button" v-if="nativeParameterType === 'array'" @click="convertToArray()"><i class="fas fa-list"></i> Convert to array</button>
		</template>
		<!-- Process Parameter -->
		<template v-else-if="isPgParameter">
			<div class="fieldValue externalData fromArgument">
				<span>Value of process parameter <tt>${{ state.from_parameter }}</tt></span>
			</div>
			<button type="button" v-if="nativeParameterType === 'array'" @click="convertToArray()"><i class="fas fa-list"></i> Convert to array</button>
		</template>
		<!-- Null -->
		<div class="description" v-else-if="type === 'null'"><i class="fas fa-info-circle"></i> This is set to&nbsp;<strong><tt>null</tt></strong>, which is usually used as placeholder for no-data values or a default value.</div>
		<!-- Select Boxes (collection id, job id, epsg code, in/output format, service type, billing plan, enums) -->
		<SelectBox v-else-if="isSelection" v-model="state" :key="type" :type="type" :editable="editable" :schema="schema"></SelectBox>
		<!-- Temporal (date, time, date-time, temporal-interval) -->
		<TemporalPicker v-else-if="isTemporal" v-model="state" :key="type" :type="type" :editable="editable"></TemporalPicker>
		<!-- Bounding Box -->
		<MapAreaSelect v-else-if="type === 'bounding-box'" v-model="state" :key="type" :id="name + '_bbox'" :editable="editable" class="areaSelector"></MapAreaSelect>
		<!-- GeoJSON -->
		<MapGeoJsonEditor v-else-if="type === 'geojson'" v-model="state" :key="type" :id="name + '_geojson'" :editable="editable" class="geoJsonEditor"></MapGeoJsonEditor>
		<!-- Process Editor -->
		<Editor v-else-if="type === 'process-graph'" class="callbackEditor" :id="name" :editable="editable" :pgParameters="schema.getCallbackParameters()" :showDiscoveryToolbar="true" v-model="state" />
		<!-- Output format options -->
		<FileFormatOptionsEditor v-else-if="type === 'output-format-options' || type === 'input-format-options'" ref="fileFormatOptionsEditor" :type="type" v-model="state" :format="this.context"></FileFormatOptionsEditor>
		<!-- Budget -->
		<Budget v-else-if="type === 'budget'" v-model="state" :editable="editable" />
		<!-- CommonMark -->
		<TextEditor class="fieldValue textarea" v-else-if="type === 'commonmark'" :id="name" :editable="editable" v-model="state" language="markdown" />
		<!-- WKT / PROJ -->
		<TextEditor class="fieldValue textarea" v-else-if="type === 'wkt2-definition' || type === 'proj-definition'" :id="name" :editable="editable" v-model="state" />
		<!-- Boolean -->
		<input class="fieldValue" v-else-if="type === 'boolean'" :checked="!!state" v-model="state" type="checkbox" :name="name" :disabled="!editable" />
		<!-- Integer -->
		<input class="fieldValue" v-else-if="type === 'integer'" v-model.number="state" type="number" :min="numericMin" :max="numericMax" :step="1" :name="name" :disabled="!editable" />
		<!-- Number -->
		<input class="fieldValue" v-else-if="type === 'number'" v-model.number="state" type="number" :min="numericMin" :max="numericMax" :step="0.01" :name="name" :disabled="!editable" />
		<!-- URL -->
		<input class="fieldValue" v-else-if="type === 'url' || type === 'uri'" v-model="state" type="url" :name="name" :disabled="!editable" />
		<!-- Objects / Arrays -->
		<ObjectEditor  v-else-if="nativeType === 'object' || nativeType === 'array'" :editable="editable" :parameter="parameter" :schema="schema" :isObject="nativeType === 'object'" v-model="state" />
		<!-- String and all other -->
		<input class="fieldValue" v-else v-model="state" type="text" :name="name" :disabled="!editable" />
	</div>
</template>

<script>
import { ProcessGraph } from '@openeo/js-processgraphs';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';

import ObjectEditor from './datatypes/ObjectEditor.vue';
import Budget from './datatypes/Budget.vue';
import MapAreaSelect from './datatypes/MapAreaSelect.vue';
import MapGeoJsonEditor from './datatypes/MapGeoJsonEditor.vue';
import TextEditor from './TextEditor.vue';

import Utils from '../utils.js';

export default {
	name: 'ParameterDataType',
	mixins: [EventBusMixin],
	components: {
		ObjectEditor,
		Budget,
		MapAreaSelect,
		MapGeoJsonEditor,
		TextEditor,
		// Asynchronously load the following components to avoid circular references.
		// See https://vuejs.org/v2/guide/components-edge-cases.html#Circular-References-Between-Components
		Editor: () => import('./Editor.vue'),
		FileFormatOptionsEditor: () => import('./datatypes/FileFormatOptionsEditor.vue'),
		ParameterDataTypes: () => import('./ParameterDataTypes.vue'),
		// Async loading for smaller starting bundle
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
		uid: String,
		processId: String
	},
	data() {
		return {
			state: null,
			context: null
		};
	},
	computed: {
		...Utils.mapGetters(['processRegistry']),
		type() {
			return this.schema.dataType();
		},
		nativeType() {
			return this.schema.nativeDataType();
		},
		nativeParameterType() {
			return this.parameter.nativeDataType();
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
				case 'output-format':
				case 'service-type':
				case 'billing-plan':
					return true;
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
		newValue() {
			if (this.isPgParameter) {
				return {from_parameter: this.schema.schema.from_parameter};
			}
			else if (this.isResult) {
				return {from_node: this.schema.schema.from_node};
			}
			else if (this.type === 'number') {
				return Number.isNaN(this.state) ? null : this.state;
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
		}
	},
	watch: {
		type(newType, oldType) {
			var refTypes = ['from_parameter', 'from_node'];
			if (refTypes.includes(oldType) && (newType === 'object' || newType === 'service-config')) {
				this.state = {};
			}
			else if (refTypes.includes(newType)) {
				var s = this.schema.schema
				var value = {};
				value[s.isRef] = s[s.isRef];
				this.state = value;
			}
		},
		value(newVal, oldVal) {
			if (newVal !== this.state) {
				this.state = this.value;
				this.initView();
			}
		},
		newValue(newVal, oldVal) {
			if (this.mounted && this.uid) {
				this.emit('processParameterValueChanged', this.uid, this.processId, this.parameter, this.type, newVal, oldVal);
			}
			this.$emit('input', newVal);
		}
	},
	created() {
		this.state = this.value;
	},
	mounted() {
		this.initView();
		this.listen('processParameterValueChanged', this.processParameterValueChanged);
		this.listen('processParameterTypeChanged', this.processParameterTypeChanged);
	},
	methods: {
		processParameterValueChanged(uid, processId, parameter, type, value, oldValue) {
			if (this.uid !== uid) {
				return;
			}

			if ((type === 'output-format' && this.type === 'output-format-options') || (type === 'input-format' && this.type === 'input-format-options')) {
				this.context = value;
			}
		},
		processParameterTypeChanged(uid, processId, parameter, newType, oldType) {
			if (this.uid !== uid) {
				return;
			}

			// Nothing to do yet
		},
		initView() {
			this.$nextTick(() => {
				this.mounted = true;
				this.emit('processParameterValueChanged', this.uid, this.processId, this.parameter, this.type, this.state, this.state, undefined);
			});
		},
		convertToArray() {
			this.state = [this.state];
			this.$emit('input', this.state);
			this.$emit('changeType', 'array');
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
	min-width: 50vw;
	width: 100%;
}
</style>