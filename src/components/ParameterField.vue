<template>
	<div class="fieldEditorContainer">
		<!-- Result Node -->
		<template v-if="isResult">
			<div class="fieldValue externalData fromNode">
				<span>Output of <tt>#{{ value.from_node }}</tt></span>
			</div>
			<button type="button" v-if="isArrayType" @click="convertToArray()"><i class="fas fa-list"></i> Convert to Array</button>
		</template>
		<!-- Callback Argument -->
		<template v-else-if="isCallbackArgument">
			<div class="fieldValue externalData fromArgument">
				<span>Value of callback argument <tt>{{ value.from_argument }}</tt></span>
			</div>
			<button type="button" v-if="isArrayType" @click="convertToArray()"><i class="fas fa-list"></i> Convert to array</button>
		</template>
		<!-- Enum -->
		<select class="fieldValue" v-else-if="schema.isEnum()" :name="fieldName" v-model="value" ref="selectFirst" :disabled="!editable">
			<option v-for="(choice, k) in schema.getEnumChoices()" :key="k" :value="choice">{{ choice }}</option>
		</select>
		<!-- Collection ID -->
		<select class="fieldValue" v-else-if="type === 'collection-id'" :name="fieldName" v-model="value" ref="selectFirst" :disabled="!editable">
			<option v-for="c in collections" :key="c.id" :value="c.id">{{ c.id }}</option>
		</select>
		<!-- EPSG Codes -->
		<select class="fieldValue" v-else-if="type === 'epsg-code'" :name="fieldName" v-model="value" :disabled="!editable">
			<option v-for="(name, code) in epsgCodes" :key="code" :value="code">{{ code }}: {{ name }}</option>
		</select>
		<!-- Output Format -->
		<select class="fieldValue" v-else-if="type === 'output-format'" :name="fieldName" v-model="value" ref="selectFirst" :disabled="!editable">
			<option v-for="(x, format) in outputFormats" :key="format" :value="format.toUpperCase()">{{ format.toUpperCase() }}</option>
		</select>
		<!-- Service Type -->
		<select class="fieldValue" v-else-if="type === 'service-type'" :name="fieldName" v-model="value" ref="selectFirst" :disabled="!editable">
			<option v-for="(x, type) in serviceTypes" :key="type" :value="type.toUpperCase()">{{ type.toUpperCase() }}</option>
		</select>
		<!-- Billing Plan -->
		<select class="fieldValue" v-else-if="type === 'billing-plan'" :name="fieldName" v-model="value" ref="selectFirst" :disabled="!editable">
			<option v-for="plan in capabilities.listPlans()" :key="plan.name" :value="plan.name">{{ plan.name }} ({{ plan.paid ? 'paid' : 'free' }})</option>
		</select>
		<!-- Temporal Interval -->
		<!-- ToDo: Support open date ranges, probably by using two separate date pickers, see also https://github.com/chronotruck/vue-ctk-date-time-picker/issues/121 -->
		<VueCtkDateTimePicker v-else-if="type === 'temporal-interval'" :key="type" v-model="value" :disabled="!editable" :range="true" label="Select start and end time" format="YYYY-MM-DD[T]HH:mm:ss[Z]" locale="en-gb"></VueCtkDateTimePicker>
		<!-- Single date and time -->
		<VueCtkDateTimePicker v-else-if="type === 'date-time'" :key="type" v-model="value" :disabled="!editable" label="Select date and time" format="YYYY-MM-DD[T]HH:mm:ss[Z]" :no-button="true" locale="en-gb"></VueCtkDateTimePicker>
		<!-- Single date -->
		<VueCtkDateTimePicker v-else-if="type === 'date'" :key="type" v-model="value" :disabled="!editable" label="Select date" :only-date="true" format="YYYY-MM-DD" formatted="ll" :no-button="true" locale="en-gb"></VueCtkDateTimePicker>
		<!-- Single time -->
		<VueCtkDateTimePicker v-else-if="type === 'time'" :key="type" v-model="value" :disabled="!editable" label="Select time" :only-time="true" format="HH:mm:ss[Z]" formatted="LT" :no-button="true" locale="en-gb"></VueCtkDateTimePicker>
		<!-- Bounding Box -->
		<MapViewer v-else-if="type === 'bounding-box'" ref="bboxMap" :key="type" :id="fieldName + '_bbox'" :showAreaSelector="true" :editable="editable" :center="[0,0]" :zoom="1" class="areaSelector"></MapViewer>
		<!-- GeoJSON -->
		<MapViewer v-else-if="type === 'geojson'" ref="geojson" :key="type" :id="fieldName + '_geojson'" :showGeoJson="value || true" :editable="editable" :center="[0,0]" :zoom="1" class="geoJsonEditor"></MapViewer>
		<!-- Callback -->
		<div v-else-if="type === 'callback'" class="border">
			<VisualEditor ref="callbackBuilder" class="callbackEditor" id="inlinePgEditor" :editable="editable" :callbackArguments="schema.getCallbackParameters()" :value="value" :enableExecute="false" :enableLocalStorage="false" />
		</div>
		<!-- Object -->
		<div v-else-if="type === 'object'" class="arrayEditor">
			<div v-if="(hasResult || hasCallbackArgument) && !isObjectItem">
				<select @change="onChangeSelectedInput($event)" v-model="selectedInput">
					<!--<option :value="'output'">Output of {{ value.from_node }}</option>-->
					<option v-bind:value="{ref: 'parameter', key: 'parameter'}">Object</option>
					<option v-for="(ref, i) in nonActiveValue.refs" v-bind:value="{ref: ref.from_node, key: 'from_node'}" :key="i">Output of {{ ref.from_node }}</option>
					<option v-for="(ref, i) in nonActiveValue.callbackRefs" v-bind:value="{ref: ref.from_argument, key: 'from_argument'}" :key="i + 30">Value of callback argument {{ ref.from_argument }}</option>
				</select>
			</div>
			<div class="objectElement" v-for="(propVal, propName) in value" :key="propName">
				<div v-if="propName === 'from_node'">
					<ParameterField :ref="propName" :editable="editable" :field="field" :isObjectItem="true" :schema="schema" :pass="{'from_node': propVal}" />
				</div>
				<div v-if="propName === 'from_argument'">
					<ParameterField :ref="propName" :editable="editable" :field="field" :isObjectItem="true" :schema="schema" :pass="{'from_argument': propVal}" />
				</div>
				<input v-if="propName !== 'from_node' && propName !== 'from_argument'" class= "fieldValue" :ref="propName" v-model="propName" type="text" :name="fieldName" :disabled="!editable"/>
				<ParameterFields :ref="propName" v-if="propName !== 'from_node' && propName !== 'from_argument'" :editable="editable" :field="field" :useAny="true" :isObjectItem="true" :pass="propVal" :nonActiveValue="nonActiveValue" />
				<button v-if="editable" class="arrayElementDelete" type="button" @click="removeFieldInObject(propName)"><i class="fas fa-trash"></i></button>
			</div>
			<button type="button" v-if="editable && (!hasResult && !hasCallbackArgument) || isObjectItem || selectedInput.ref === 'parameter'" @click="addFieldInObject('unnamed', 1)"><i class="fas fa-plus"></i> Add</button>
		</div>
		<!-- Null -->
		<template v-else-if="type === 'null'"></template>
		<!-- Arrays -->
		<div v-else-if="isArrayType" class="arrayEditor">
			<draggable v-model="value">
				<transition-group name="arrayElements">
					<div class="fieldValue arrayElement" v-for="(e, k) in value" :key="e.id">
						<ParameterField :ref="e.id" :editable="editable" :field="field" :schema="schema" :pass="e.value" :isItem="true" />
						<button v-if="editable" class="arrayElementDelete" type="button" @click="removeField(k)"><i class="fas fa-trash"></i></button>
						<div class="mover" v-if="editable"><i class="fas fa-arrows-alt"></i></div>
					</div>
				</transition-group>
			</draggable>
			<button type="button" v-if="editable" @click="addField()"><i class="fas fa-plus"></i> Add</button>
		</div>
		<!-- Output format options -->
		<OutputFormatOptionsEditor v-else-if="type === 'output-format-options'" ref="outputFormatOptionsEditor" :value="value" :format="this.context"></OutputFormatOptionsEditor>
		<!-- Budget -->
		<template v-else-if="type === 'budget'">
			<input type="checkbox" v-model="hasBudget" value="1" />
			<input type="number" min="0.00" step="0.01" :disabled="!hasBudget || !editable" :name="fieldName" v-model.number="value" />&nbsp;{{ capabilities.currency() }}
			<!-- ToDo: Set max value of the input to the maximum budget available -->
		</template>
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

import VueCtkDateTimePicker from 'vue-ctk-date-time-picker';
import 'vue-ctk-date-time-picker/dist/vue-ctk-date-time-picker.css';

import MapViewer from './MapViewer.vue';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';

import { ProcessGraph } from '@openeo/js-commons';
import Utils from '../utils.js';

export default {
	name: 'ParameterField',
	mixins: [EventBusMixin],
	components: {
		draggable,
		MapViewer,
		VueCtkDateTimePicker,
		// Asynchronously load the following components to avoid circular references.
		// See https://vuejs.org/v2/guide/components-edge-cases.html#Circular-References-Between-Components
		OutputFormatOptionsEditor: () => import('./OutputFormatOptionsEditor.vue'),
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
			hasBudget: false,
			epsgCodes: [],
			context: null,
			selectedInput: null
		};
	},
	computed: {
		...Utils.mapState('server', ['collections', 'outputFormats', 'serviceTypes']),
		...Utils.mapGetters('server', ['capabilities', 'processRegistry']),
		type() {
			return this.isItem ? this.schema.arrayOf() : this.schema.dataType();
		},
		useTextarea() {
			return (this.type === 'proj-definition' || this.type === "service-type-parameters" || this.type === 'process-graph-variables' || this.type === 'commonmark');
		},
		fieldName() {
			return this.field.name + (Array.isArray(this.field.value) ? '[]' : '');
		},
		isResult() {
			return Utils.isObject(this.value) && this.value.from_node && Object.keys(this.value).length == 1 && (this.type !== "object" || this.isObjectItem);
		},
		hasResult() {
			return Utils.isObject(this.value) && (this.value.from_node || (this.nonActiveValue && this.nonActiveValue.refs.length > 0));
		},
		isCallbackArgument() {
			return Utils.isObject(this.value) && this.value.from_argument && Object.keys(this.value).length == 1 && (this.type !== "object" || this.isObjectItem);;
		},
		hasCallbackArgument() {
			return Utils.isObject(this.value) && (this.value.from_argument || (this.nonActiveValue && this.nonActiveValue.callbackRefs.length > 0));
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
		}
	},
	watch: {
		pass() {
			this.value = this.initValue(this.pass);
		},
		schema() {
			this.value = this.initValue(this.value);
			this.$nextTick(this.initView);
		},
		value(newVal, oldVal) {
			if (this.mounted && this.uid) {
				this.emit('processParameterValueChanged', this.uid, this.processId, this.field, this.type, newVal, oldVal);
			}
		}
	},
	created() {
		this.value = this.initValue(this.pass);
		if(this.type === "object"){
			this.determineSelectedInput();
		}
	},
	mounted() {
		this.$nextTick(this.initView);
		this.listen('processParameterValueChanged', this.processParameterValueChanged);
		this.listen('processParameterTypeChanged', this.processParameterTypeChanged);
	},
	methods: {
		onChangeSelectedInput(event) {
			let inputTarget = this.selectedInput;
			this.toggleValueActivity(inputTarget);
		},
		toggleValueActivity(inputTarget){
			let newVal;
			let key = inputTarget.key;
			let typeRefDesignation = key === "from_argument" ? "callbackRefs" : "refs";

			if(key === "parameter"){
				this.value = this.nonActiveValue.value;
				return;
			}
			else if (!this.value.from_node && !this.value.from_argument) {
				this.nonActiveValue.value = this.value;
				newVal = this.nonActiveValue[typeRefDesignation].find(p => p[key] == inputTarget.ref);
			}
			else{
				newVal = this.nonActiveValue[typeRefDesignation].find(p => p[key] == inputTarget.ref);
				this.$refs[key][0].value = newVal;
			}
			this.value = newVal;
		},
		determineSelectedInput(){
			if(this.value.from_node){
				this.selectedInput = {ref: this.value.from_node, key: 'from_node'};
			}
			else if(this.value.from_argument){
				this.selectedInput = {ref: this.value.from_argument, key: 'from_argument'};
			}
			else {
				this.selectedInput = {ref: 'parameter', key: 'parameter'};
			}
		},
		processParameterValueChanged(uid, processId, field, type, value, oldValue) {
			if (this.uid !== uid) {
				return;
			}

			if (type === 'output-format' && this.type === 'output-format-options') {
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
			if (this.type === 'bounding-box') {
				if (Utils.isObject(this.value) && Object.keys(this.value).length >= 4) {
					this.$refs.bboxMap.areaSelect.setBounds(this.value);
				}
			}
			else if (this.type === 'epsg-code') {
				this.loadEpsgCodes();
			}
			if (this.$refs.selectFirst && this.$refs.selectFirst.selectedOptions.length === 0) {
				this.$refs.selectFirst.selectedIndex = 0;
				// selectedIndex doesn't fire a v-model change, so set the value manually.
				this.value = this.$refs.selectFirst.value;
			}
			this.mounted = true;
			this.emit('processParameterValueChanged', this.uid, this.processId, this.field, this.type, this.value, this.value, undefined);
		},
		initValue(v) {
			if (this.type === 'temporal-interval') {
				if (Array.isArray(v) && v.length >= 2) {
					v = {
						start: v[0],
						end: v[1]
					};
				}
				else if (!Utils.isObject(v) || !v.start || !v.end) {
					v = null;
				}
			}
			else if (this.type === 'geojson') {
				if (!Utils.isObject(v) || !v.type) {
					v = null;
				}
			}
			else if (this.type === 'output-format' || this.type === 'service-type') {
				v = (typeof v === 'string' ? v.toUpperCase() : null);
			}
			else if (this.type === 'callback') {
				if (Utils.isObject(v) && v.callback) {
					v = v.callback;
				}
				else if (!(v instanceof ProcessGraph)) {
					v = null;
				}
			}
			else if (this.type === 'billing-plan' && !v) {
				var defaultPlans = this.capabilities.listPlans().filter(plan => plan.default);
				if (!v && defaultPlans.length === 1) {
					v = defaultPlans[0].name;
				}
			}
			else if (this.type === 'budget') {
				this.hasBudget = typeof v === 'number';
			}
			else if (this.isArrayType) {
				v = this.initArray(v);
			}
			else if(this.type === 'object'){
				this.initNonActiveValue();
				if(v == null || Object.keys(v).length == 0)
					return {};
				else
					return v;
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
		loadEpsgCodes() {
			if (!this.epsgCodes.length) {
				import('../assets/epsg.json').then(({default: json}) => {
					this.epsgCodes = json;
				});
			}
		},
		getValue() {
			if (this.isCallbackArgument || this.isResult) {
				return this.value; // Pass through
			}
			else if (this.type === 'output-format-options') {
				return this.$refs.outputFormatOptionsEditor.getValue();
			}
			else if (this.type === 'temporal-interval') {
				return [this.value.start, this.value.end];
			}
			else if (this.type === 'callback') {
				var pg = this.$refs.callbackBuilder.makeProcessGraph();
				var obj = new ProcessGraph(pg, this.processRegistry);
				obj.setParent(this.processId, this.field.name);
				obj.parse();
				return {
					callback: obj
				};
			}
			else if (this.type === 'bounding-box') {
				return this.$refs.bboxMap.areaSelect.getBounds();
			}
			else if (this.type === 'geojson') {
				return this.$refs.geojson.getGeoJson();
			}
			else if(this.type === 'object'){
				for (let key in this.value){
					if(this.value.hasOwnProperty(key)){
						//TODO: find proper way
						let isResultVal = this.$refs[key].length == 1;
						let inputType = this.$refs[key][0].value.from_node ? "from_node" : "from_argument";
						let newKey = isResultVal ? inputType : this.$refs[key][0].value;
						let newValue = isResultVal ? this.$refs[key][0].value[inputType] : this.$refs[key][1].getValue();
						if(newKey !== key)
							delete this.value[key];
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
			else if (this.type === 'number' || this.type === 'budget') {
				return Number.isNaN(this.value) ? null : this.value;
			}
			else if (this.type === 'integer' || this.type === 'epsg-code') {
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
		getNonActiveValue(){
			if(this.type === 'object')
				return this.nonActiveValue;
			else
				return {};
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
		initNonActiveValue(){
			this.nonActiveValue = this.field.getNonActiveValue();
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
		addFieldInObject(newPropName, number){
			if(this.value[newPropName + number] === undefined){
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

<style>
.datepicker button {
	margin: 0px;
}
</style>

<style scoped>
.arrayEditor, .arrayEditor > div {
	width: 100%;
}
.arrayElement {
	transition: all 0.5s;
	margin-bottom: 0.3em;
}

.arrayElements-enter, .arrayElements-active {
	opacity: 0;
}
.arrayElementDelete {
	margin-left: 5px;
	margin-right: 5px;
}
.objectElement{
	display: flex;
	align-items:flex-start;
	border-bottom: 1px solid black;
	padding-bottom: 5px;
	padding-top: 5px;
}
.mover {
	padding: 3px 1em;
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
