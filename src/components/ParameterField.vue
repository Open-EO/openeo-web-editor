<template>
	<div class="fieldEditorContainer">
		<!-- Result Node -->
		<template v-if="isResult">
			<div class="fieldValue externalData fromNode">
				<span>Output of <tt>#{{ value.from_node }}</tt></span>
			</div>
			<button type="button" v-if="isArrayType" @click="convertToArray()"><i class="fas fa-list"></i> Convert to array</button>
		</template>
		<!-- Process Parameter -->
		<template v-else-if="isPgParameter">
			<div class="fieldValue externalData fromArgument">
				<span>Value of process parameter <tt>${{ value.from_parameter }}</tt></span>
			</div>
			<button type="button" v-if="isArrayType" @click="convertToArray()"><i class="fas fa-list"></i> Convert to array</button>
		</template>
		<!-- Select Boxes (collection id, job id, epsg code, in/output format, service type, billing plan, enums) -->
		<SelectBox v-else-if="isSelection" v-model="value" :key="type" :type="type" :editable="editable" :schema="schema"></SelectBox>
		<!-- Temporal (date, time, date-time, temporal-interval) -->
		<TemporalPicker v-else-if="isTemporal" v-model="value" :key="type" :type="type" :editable="editable"></TemporalPicker>
		<!-- Bounding Box -->
		<MapAreaSelect v-else-if="type === 'bounding-box'" v-model="value" :key="type" :id="fieldName + '_bbox'" :editable="editable" class="areaSelector"></MapAreaSelect>
		<!-- GeoJSON -->
		<MapGeoJsonEditor v-else-if="type === 'geojson'" v-model="value" :key="type" :id="fieldName + '_geojson'" :editable="editable" class="geoJsonEditor"></MapGeoJsonEditor>
		<!-- Process Editor -->
		<div v-else-if="type === 'process-graph'" class="border">
			<VisualEditor ref="callbackBuilder" class="callbackEditor" id="inlinePgEditor" :editable="editable" :pgParameters="schema.getCallbackParameters()" :value="value" />
		</div>
		<!-- Object -->
		<div v-else-if="isObjectType" class="objectEditor">
			<div class="objectElement" v-for="(propVal, propName) in value" :key="propName">
				<input class= "fieldKey" :ref="propName" :value="propName" type="text" :name="fieldName" :disabled="!editable"/>
				<ParameterFields :ref="propName" :editable="editable" :field="field" :useAny="true" :isObjectItem="true" :pass="propVal" />
				<button v-if="editable" class="arrayElementDelete" type="button" @click="removeFieldInObject(propName)"><i class="fas fa-trash"></i></button>
			</div>
			<button type="button" class="addBtn" v-if="editable" @click="addFieldInObject('unnamed', 1)"><i class="fas fa-plus"></i> Add</button>
		</div>
		<!-- Null -->
		<div class="description" v-else-if="type === 'null'"><i class="fas fa-info-circle"></i> The parameter is set to&nbsp;<strong><tt>null</tt></strong>, which is usually used as placeholder for no-data values or a default value.</div>
		<!-- Arrays -->
		<div v-else-if="isArrayType" class="arrayEditor">
			<draggable v-model="value" handle=".mover">
				<transition-group name="arrayElements">
					<div class="fieldValue arrayElement" v-for="(e, k) in value" :key="e.id">
						<ParameterField :ref="e.id" :editable="editable" :field="field" :schema="schema" :pass="e.value" :isItem="true" />
						<button v-if="editable" class="arrayElementDelete" type="button" @click="removeField(k)"><i class="fas fa-trash"></i></button>
						<div class="mover" v-if="editable"><i class="fas fa-arrows-alt"></i></div>
					</div>
				</transition-group>
			</draggable>
			<button type="button" class="addBtn" v-if="editable" @click="addField()"><i class="fas fa-plus"></i> Add</button>
		</div>
		<!-- Output format options -->
		<FileFormatOptionsEditor v-else-if="type === 'output-format-options' || type === 'input-format-options'" ref="fileFormatOptionsEditor" :type="type" :value="value" :format="this.context"></FileFormatOptionsEditor>
		<!-- Budget -->
		<Budget v-else-if="type === 'budget'" v-model="value" :editable="editable" />
		<!-- Multiline text / Textarea -->
		<textarea class="fieldValue textarea" v-else-if="useTextarea" :name="fieldName" v-model="value" :disabled="!editable"></textarea>
		<!-- Boolean -->
		<input class="fieldValue" v-else-if="type === 'boolean'" :checked="!!value" v-model="value" type="checkbox" :name="fieldName" :disabled="!editable" />
		<!-- Integer -->
		<input class="fieldValue" v-else-if="type === 'integer'" v-model.number="value" type="number" :min="numericMin" :max="numericMax" :step="1" :name="fieldName" :disabled="!editable" />
		<!-- Number -->
		<input class="fieldValue" v-else-if="type === 'number'" v-model.number="value" type="number" :min="numericMin" :max="numericMax" :step="0.01" :name="fieldName" :disabled="!editable" />
		<!-- URL -->
		<input class="fieldValue" v-else-if="type === 'url' || type === 'uri'" v-model="value" type="url" :name="fieldName" :disabled="!editable" />
		<!-- String and all other -->
		<input class="fieldValue" v-else v-model="value" type="text" :name="fieldName" :disabled="!editable" />
	</div>
</template>

<script>
import draggable from 'vuedraggable';
import { ProcessGraph } from '@openeo/js-processgraphs';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';

import Budget from './datatypes/Budget.vue';
import SelectBox from './datatypes/SelectBox.vue';
import TemporalPicker from './datatypes/TemporalPicker.vue';
import MapAreaSelect from './datatypes/MapAreaSelect.vue';
import MapGeoJsonEditor from './datatypes/MapGeoJsonEditor.vue';

import Field from './blocks/field.js';
import Utils from '../utils.js';

export default {
	name: 'ParameterField',
	mixins: [EventBusMixin],
	components: {
		draggable,
		Budget,
		MapAreaSelect,
		MapGeoJsonEditor,
		SelectBox,
		TemporalPicker,
		// Asynchronously load the following components to avoid circular references.
		// See https://vuejs.org/v2/guide/components-edge-cases.html#Circular-References-Between-Components
		FileFormatOptionsEditor: () => import('./datatypes/FileFormatOptionsEditor.vue'),
		VisualEditor: () => import('./VisualEditor.vue'),
		ParameterFields: () => import('./ParameterFields.vue')
	},
	props: {
		field: Object,
		editable: {
			type: Boolean,
			default: true
		},
		schema: Object,
		pass: {},
		uid: String,
		processId: String,
		isItem: {
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
			value: null,
			context: null
		};
	},
	computed: {
		...Utils.mapGetters(['processRegistry']),
		type() {
			if (this.isItem) {
				return this.schema.arrayOf();
			}
			else if (this.schema.schema.isRef) {
				return this.schema.schema.isRef;
			}
			return this.schema.dataType();
		},
		isTemporal() {
			return (this.type === 'date' || this.type === 'time' || this.type === 'date-time' || this.type === 'temporal-interval');
		},
		useTextarea() {
			return (this.type === 'proj-definition' || this.type === 'commonmark');
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
		fieldName() {
			return this.field.name + (Array.isArray(this.field.value) ? '[]' : '');
		},
		isResult() {
			return Utils.isObject(this.value) && this.value.from_node && Object.keys(this.value).length == 1 && (this.type !== "object" || this.isObjectItem);
		},
		hasResult() {
			return Utils.isObject(this.value) && (this.value.from_node || this.refs.from_node.length > 0);
		},
		isPgParameter() {
			return Utils.isObject(this.value) && this.value.from_parameter && Object.keys(this.value).length == 1 && (this.type !== "object" || this.isObjectItem);
		},
		hasPgParameter() {
			return Utils.isObject(this.value) && (this.value.from_parameter || this.refs.from_parameter.length > 0);
		},
		isObjectType() {
			return this.checkObjectType(this.type);
		},
		isArrayType() {
			return (this.type === 'array' || this.type === 'temporal-intervals');
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
		refs() {
			return this.field.getRefs();
		}
	},
	watch: {
		pass() {
			this.value = this.initValue(this.pass);
			this.initView();
		},
		type(newType, oldType) {
			var refTypes = ['from_parameter', 'from_node'];
			if (refTypes.includes(oldType) && this.checkObjectType(newType)) {
				this.value = {};
			}
			else if (refTypes.includes(newType)) {
				var s = this.schema.schema;
				var value = {};
				value[s.isRef] = s[s.isRef];
				this.value = value;
			}
		},
		value(newVal, oldVal) {
			if (this.mounted && this.uid) {
				this.emit('processParameterValueChanged', this.uid, this.processId, this.field, this.type, newVal, oldVal);
			}
		}
	},
	created() {
		this.value = this.initValue(this.pass);
	},
	mounted() {
		this.initView();
		this.listen('processParameterValueChanged', this.processParameterValueChanged);
		this.listen('processParameterTypeChanged', this.processParameterTypeChanged);
	},
	methods: {
		checkObjectType(type) {
			return (type === 'object' || type === 'service-config');
		},
		processParameterValueChanged(uid, processId, field, type, value, oldValue) {
			if (this.uid !== uid) {
				return;
			}

			if ((type === 'output-format' && this.type === 'output-format-options') || (type === 'input-format' && this.type === 'input-format-options')) {
				this.context = value;
			}
		},
		processParameterTypeChanged(uid, processId, field, newType, oldType) {
			if (this.uid !== uid) {
				return;
			}

			// Nothing to do yet
		},
		initView() {
			this.$nextTick(() => {
				this.mounted = true;
				this.emit('processParameterValueChanged', this.uid, this.processId, this.field, this.type, this.value, this.value, undefined);
			});
		},
		initValue(v) {
			if (this.type === 'process-graph') {
				if (!(v instanceof ProcessGraph)) {
					v = null;
				}
			}
			else if (this.isArrayType) {
				v = this.initArray(v);
			}
			else if(this.isObjectType) {
				if(v == null || Object.keys(v).length == 0) {
					return {};
				}
				else {
					return v;
				}
			}
			else if (this.useTextarea) {
				if (typeof v === 'object') {
					if (typeof this.pass === 'object' && this.pass !== null) {
						v = JSON.stringify(v, null, 2);
					}
					else {
						v = "";
					}
				}
			}
			return v;
		},
		getValue() {
			if (this.isPgParameter) {
				return {from_parameter: this.schema.schema.from_parameter};
			}
			else if (this.isResult) {
				return {from_node: this.schema.schema.from_node};
			}
			else if (this.type === 'output-format-options' || this.type === 'input-format-options') {
				return this.$refs.fileFormatOptionsEditor.getValue();
			}
			else if (this.type === 'process-graph') {
				var pg = this.$refs.callbackBuilder.makeCustomProcess();
				var obj = new ProcessGraph(pg, this.processRegistry);
				obj.setParent(this.processId, this.field.name);
				obj.parse();
				return obj;
			}
			else if(this.isObjectType) {
				for (let key in this.value) {
					if(this.value.hasOwnProperty(key)) {
						//check if output/callbackArg is selected in top selection box
						let isResultVal = this.$refs[key].length == 1 && (this.$refs[key][0].value.from_node || this.$refs[key][0].value.from_parameter);
						let inputType = this.$refs[key][0].value.from_node ? "from_node" : "from_parameter";
						let newKey = isResultVal ? inputType : this.$refs[key][0].value;
						let newValue;
						if (isResultVal) {
							newValue = this.$refs[key][0].value[inputType];
						}
						else {
							newValue = this.$refs[key][1].getValue();
						}
						if(newKey !== key) {
							delete this.value[key];
						}
						this.value[newKey] = newValue;
					}
				}
				return this.value;
			}
			else if (this.isArrayType) {
				var values = [];
				var itemType = this.schema.arrayOf();
				for(var i in this.value) {
					var fieldId = this.value[i].id;
					var value = this.$refs[fieldId][0].getValue();
					if (itemType === 'band-name' && (typeof value !== 'string' || value.length === 0)) {
						continue; // Ignore invalid band names
					}
					values.push(value);
				}
				return values;
			}
			else if (this.type === 'number') {
				return Number.isNaN(this.value) ? null : this.value;
			}
			else if (this.type === 'integer') {
				var num = Number.parseInt(this.value);
				return Number.isNaN(num) ? null : num;
			}
			else if (this.type === 'null') {
				return null;
			}
			else if (this.useTextarea) {
				if (typeof this.value === 'string' && this.value.length > 0) {
					if (this.type === 'object' || (typeof this.pass === 'object' && this.pass !== null)) {
						return JSON.parse(this.value);
					}
					else {
						return this.value;
					}
				}
				else {
					return null;
				}
			}
			else if (typeof this.value === 'string' && this.value.length > 0 && (this.type === 'any' || this.type === 'mixed')) {
				// Try to guess whether it is a number or not
				var num = Number(this.value);
				return Number.isNaN(num) ? this.value : num;
			}
			else {
				return this.value;
			}
		},
		initArray(arr) {
			var v = [];
			if (Array.isArray(arr)) {
				for(var i in arr) {
					if (Utils.isObject(arr[i]) && arr[i].id) {
						v.push(arr[i]);
					}
					else {
						v.push({
							id: "arrayElement" + i,
							value: arr[i]
						});
					}
				}
			}
			return v;
		},
		convertToArray() {
			this.value = this.initArray([this.value]);
		},
		addField() {
			if (!Array.isArray(this.value)) {
				this.value = [];
			}

			var def = null;
			var itemType = this.schema.arrayOf();
			if (itemType === 'string' || itemType === 'band-name') {
				def = "";
			}
			else if (itemType === 'number' || itemType === 'integer') {
				def = 0;
			}
			else if (itemType === 'array') {
				def = [];
			}

			this.value.push({
				id: this.value.length,
				value: def
			});
			return false;
		},
		addFieldInObject(newPropName, number) {
			if (!Utils.isObject(this.value)) {
				this.value = {};
			}
			if(typeof this.value[newPropName + number] === 'undefined'){
				this.$set(this.value, newPropName + number, "");
				return false;
			}
			else{
				number++;
				this.addFieldInObject(newPropName, number);
			}
		},
		removeFieldInObject(propName){
			this.$delete(this.value, propName);
		},
		removeField(k) {
			this.value.splice(k, 1);
			return false;
		}
	}
};
</script>

<style scoped>
.arrayEditor, .objectEditor, .arrayEditor > div, .objectEditor > div {
	width: 100%;
}
.arrayElement {
	transition: all 0.5s;
	padding: 1px;
	margin: 1px 0;
	border: 1px solid transparent;
}
.arrayElement.sortable-chosen {
	background: #eee;
	border-color: #ccc;
	border-radius: 3px;
}
.arrayElement.sortable-chosen .arrayElementDelete {
	visibility: hidden;
}

.arrayElements-enter, .arrayElements-active {
	opacity: 0;
}
.arrayElementDelete {
	margin-left: 1em;
}
.addBtn {
	margin: 5px 0;
}
.objectElement {
	display: flex;
	align-items: flex-start;
	padding: 5px 0;
	border-bottom: 1px dotted #ccc;
}
.mover {
	padding: 3px 1em;
	cursor: pointer;
}
.areaSelector, .geoJsonEditor {
	height: 500px;
	flex-grow: 1;
}
.textarea {
	width: 100%;
	height: 200px;
	font-family: monospace;
}
.border {
	border: 1px solid #ccc;
	width: 100%;
	height: 100%;
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
