<template>
	<div class="fieldEditorContainer">
		<template v-if="isResult">
			<div class="fieldValue externalData fromNode">
				<span>Output of <tt>#{{ value.from_node }}</tt></span>
			</div>
			<button type="button" v-if="isArray" @click="convertToArray()"><i class="fas fa-list"></i> Convert to Array</button>
		</template>
		<template v-else-if="isCallbackArgument">
			<div class="fieldValue externalData fromArgument">
				<span>Value of callback argument <tt>{{ value.from_argument }}</tt></span>
			</div>
			<button type="button" v-if="isArray" @click="convertToArray()"><i class="fas fa-list"></i> Convert to array</button>
		</template>
		<select class="fieldValue" v-else-if="schema.isEnum()" :name="fieldName" v-model="value" ref="selectFirst" :disabled="!editable">
			<option v-for="(choice, k) in schema.getEnumChoices()" :key="k" :value="choice">{{ choice }}</option>
		</select>
		<select class="fieldValue" v-else-if="type === 'collection-id'" :name="fieldName" v-model="value" ref="selectFirst" :disabled="!editable">
			<option v-for="c in collections" :key="c.id" :value="c.id">{{ c.id }}</option>
		</select>
		<select class="fieldValue" v-else-if="type === 'output-format'" :name="fieldName" v-model="value" ref="selectFirst" :disabled="!editable">
			<option v-for="(x, format) in outputFormats" :key="format" :value="format.toUpperCase()">{{ format.toUpperCase() }}</option>
		</select>
		<select class="fieldValue" v-else-if="type === 'service-type'" :name="fieldName" v-model="value" ref="selectFirst" :disabled="!editable">
			<option v-for="(x, type) in serviceTypes" :key="type" :value="type.toUpperCase()">{{ type.toUpperCase() }}</option>
		</select>
		<select class="fieldValue" v-else-if="type === 'billing-plan'" :name="fieldName" v-model="value" ref="selectFirst" :disabled="!editable">
			<option v-for="plan in capabilities.listPlans()" :key="plan.name" :value="plan.name">{{ plan.name }} ({{ plan.paid ? 'paid' : 'free' }})</option>
		</select>
		<template v-else-if="type === 'temporal-interval'">
			<VueCtkDateTimePicker v-model="value" :disabled="!editable" :range="true" label="Select start and end time" format="YYYY-MM-DD[T]HH:mm:ss[Z]"></VueCtkDateTimePicker>
			<!-- ToDo: Support open date ranges, probably by using two separate date pickers, see also https://github.com/chronotruck/vue-ctk-date-time-picker/issues/121 -->
		</template>
		<template v-else-if="type === 'date-time'">
			<VueCtkDateTimePicker v-model="value" :disabled="!editable" label="Select date and time" format="YYYY-MM-DD[T]HH:mm:ss[Z]" no-button="true"></VueCtkDateTimePicker>
		</template>
		<template v-else-if="type === 'date'">
			<VueCtkDateTimePicker v-model="value" :disabled="!editable" label="Select date" only-date="true" format="YYYY-MM-DD" no-button="true"></VueCtkDateTimePicker>
		</template>
		<template v-else-if="type === 'time'">
			<VueCtkDateTimePicker v-model="value" :disabled="!editable" label="Select time" only-time="true" format="HH:mm:ss[Z]" no-button="true"></VueCtkDateTimePicker>
		</template>
		<template v-else-if="type === 'bounding-box'">
			<MapViewer ref="bboxMap" :id="fieldName" :showAreaSelector="true" :readOnly="editable" :center="[0,0]" :zoom="1" class="areaSelector"></MapViewer>
		</template>
		<div v-else-if="type === 'callback'" class="border">
			<VisualEditor ref="callbackBuilder" class="callbackEditor" id="inlinePgEditor" :editable="editable" :callbackArguments="schema.getCallbackParameters()" :value="value" :enableExecute="false" :enableLocalStorage="false" />
		</div>
		<template v-else-if="type === 'null'">
			The field will be set to&nbsp;<strong><tt>null</tt></strong>.
		</template>
		<div v-else-if="isArray" class="arrayEditor">
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
		<template v-else-if="type === 'budget'">
			<input type="checkbox" v-model="hasBudget" value="1" />
			<input type="number" min="0.00" step="0.01" :disabled="!hasBudget || !editable" :name="fieldName" v-model="value" />&nbsp;{{ capabilities.currency() }}
			<!-- ToDo: Set max value of the input to the maximum budget available -->
		</template>
		<textarea class="fieldValue textarea" v-else-if="useTextarea" :name="fieldName" v-model="value" :disabled="!editable"></textarea>
		<input class="fieldValue" v-else-if="type === 'boolean'" :checked="!!value" v-model="value" type="checkbox" :name="fieldName" :disabled="!editable" />
		<input class="fieldValue" v-else v-model="value" type="text" :name="fieldName" :disabled="!editable" />
	</div>
</template>

<script>
import draggable from 'vuedraggable';

import VueCtkDateTimePicker from 'vue-ctk-date-time-picker';
import 'vue-ctk-date-time-picker/dist/vue-ctk-date-time-picker.css';

import MapViewer from './MapViewer';

import { ProcessGraph } from '@openeo/js-commons';
import Utils from '../utils.js';

export default {
	name: 'ParameterField',
	components: {
		draggable,
		MapViewer,
		// Asynchronously load the component to avoid circular references.
		// See https://vuejs.org/v2/guide/components-edge-cases.html#Circular-References-Between-Components
		VisualEditor: () => import('./VisualEditor.vue'),
		VueCtkDateTimePicker
	},
	props: {
		field: Object,
		editable: {
			type: Boolean,
			default: true
		},
		schema: Object,
		pass: {},
		processId: String,
		isItem: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			value: null,
			hasBudget: false
		}
	},
	computed: {
		...Utils.mapState('server', ['collections', 'outputFormats', 'serviceTypes']),
		...Utils.mapGetters('server', ['capabilities', 'processRegistry']),
		type() {
			return this.isItem ? this.schema.arrayOf() : this.schema.dataType();
		},
		useTextarea() {
			return (this.type === 'geojson' || this.type === 'proj-definition' || this.type === 'output-format-options' || this.type === "service-type-parameters" || this.type === 'process-graph-variables' || this.type === 'commonmark');
		},
		fieldName() {
			return this.field.name + (Array.isArray(this.field.value) ? '[]' : '');
		},
		isResult() {
			return Utils.isObject(this.value) && this.value.from_node;
		},
		isCallbackArgument() {
			return Utils.isObject(this.value) && this.value.from_argument;
		},
		isArray() {
			return (this.type === 'array' || this.type === 'temporal-intervals');
		}
	},
	watch: {
		schema() {
			this.$nextTick(this.initView);
		}
	},
	created() {
		this.value = this.initValue();
	},
	mounted() {
		this.$nextTick(this.initView);
	},
	methods: {
		initView() {
			if (this.type === 'bounding-box') {
				if (Utils.isObject(this.value) && Object.keys(this.value).length >= 4) {
					this.$refs.bboxMap.areaSelect.setBounds(this.value);
				}
/*				if (!this.editable) {
					map.touchZoom.disable();
					map.doubleClickZoom.disable();
					map.scrollWheelZoom.disable();
					map.boxZoom.disable();
					map.keyboard.disable();
					map.dragging.disable();
				} */
			}
			if (this.$refs.selectFirst && this.$refs.selectFirst.selectedOptions.length === 0) {
				this.$refs.selectFirst.selectedIndex = 0;
				// selectedIndex doesn't fire a v-model change, so set the value manually.
				this.value = this.$refs.selectFirst.value;
			}
		},
		initValue() {
			var v;
			if (Utils.isObject(this.$props.pass) && (this.$props.pass.from_argument || this.$props.pass.from_node)) {
				v = this.$props.pass;
			}
			else if (this.type === 'temporal-interval') {
				if (Array.isArray(this.$props.pass) && this.$props.pass.length >= 2) {
					v = {
						start: this.$props.pass[0],
						end: this.$props.pass[1]
					};
				}
				else {
					v = "";
				}
			}
			else if (this.type === 'output-format' || this.type === 'service-type') {
				v = typeof this.$props.pass === 'string' ? this.$props.pass.toUpperCase() : this.$props.pass;
			}
			else if (this.type === 'callback') {
				if (Utils.isObject(this.$props.pass) && this.$props.pass.callback) {
					v = this.$props.pass.callback;
				}
				else {
					v = null;
				}
			}
			else if (this.type === 'billing-plan') {
				var defaultPlans = this.capabilities.listPlans().filter(plan => plan.default);
				if (defaultPlans.length === 1) {
					v = defaultPlans[0].name;
				}
			}
			else if (this.type === 'budget') {
				v = this.$props.pass;
				this.hasBudget = typeof v === 'number';
			}
			else if (this.isArray) {
				v = this.initArray(this.$props.pass);
			}
			else if (this.useTextarea) {
				if (typeof this.$props.pass === 'object') {
					if (typeof this.$props.pass === 'object' && this.$props.pass !== null) {
						v = JSON.stringify(this.$props.pass, null, 2);
					}
					else {
						v = "";
					}
				}
				else {
					v = this.$props.pass;
				}
			}
			else {
				v = this.$props.pass;
			}
			return v;
		},
		getValue() {
			if (this.isCallbackArgument || this.isResult) {
				return this.value; // Pass through
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
			else if (this.isArray) {
				var values = [];
				for(var i in this.value) {
					var fieldId = this.value[i].id;
					values.push(this.$refs[fieldId][0].getValue());
				}
				return values;
			}
			else if (this.type === 'number' || this.type === 'budget') {
				var num = Number.parseFloat(this.value);
				return Number.isNaN(num) ? null : num;
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
					if (typeof this.$props.pass === 'object' && this.$props.pass !== null) {
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
			else if (this.type === 'any' || this.type === 'mixed') {
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
					v.push({
						id: "arrayElement" + i,
						value: arr[i]
					});
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
			this.value.push({
				id: this.value.length,
				value: null
			});
			return false;
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
.mover {
	padding: 3px 1em;
}
.areaSelector {
	height: 500px;
	flex-grow: 1;
}
.textarea {
	width: 100%;
	height: 200px;
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
