<template>
	<div class="fieldEditorContainer">
		<select class="fieldValue" v-if="schema.isEnum()" :name="fieldName" v-model="value">
			<option v-for="(choice, k) in schema.getEnumChoices()" :key="k" :value="choice">{{ choice }}</option>
		</select>
		<template v-else-if="type === 'temporal-interval'">
			<VueCtkDateTimePicker v-model="value" :range="true" label="Select start and end time" format="YYYY-MM-DD[T]HH:mm:ss[Z]"></VueCtkDateTimePicker>
			<!-- ToDo: Support open date ranges, probably by using two separate date pickers, see also https://github.com/chronotruck/vue-ctk-date-time-picker/issues/121 -->
		</template>
		<template v-else-if="type === 'date-time'">
			<VueCtkDateTimePicker v-model="value" label="Select date and time" format="YYYY-MM-DD[T]HH:mm:ss[Z]" no-button="true"></VueCtkDateTimePicker>
		</template>
		<template v-else-if="type === 'date'">
			<VueCtkDateTimePicker v-model="value" label="Select date" only-date="true" format="YYYY-MM-DD" no-button="true"></VueCtkDateTimePicker>
		</template>
		<template v-else-if="type === 'time'">
			<VueCtkDateTimePicker v-model="value" label="Select time" only-time="true" format="HH:mm:ss[Z]" no-button="true"></VueCtkDateTimePicker>
		</template>
		<template v-else-if="type === 'bounding-box'">
			<div id="areaSelector"></div>
		</template>
		<div v-else-if="type === 'callback'" class="border">
			<VisualEditor ref="callbackBuilder" fieldId="inlinePgEditor" :callbackArguments="schema.getCallbackParameters()" :value="value" />
		</div>
		<template v-else-if="type === 'null'">
			The field will be set to <strong><tt>null</tt></strong>.
		</template>
		<template v-else-if="type === 'array' || type === 'temporal-intervals'">
			<draggable v-model="value">
				<transition-group name="arrayElements">
					<div class="fieldValue arrayElement" v-for="(e, k) in value" :key="e.id">
						<ParameterField ref="arrayFields" :field="field" :schema="schema" :pass="e.value" :isItem="true" />
						<button type="button" @click="removeField(k)"><i class="fas fa-trash"></i></button>
						<div class="mover"><i class="fas fa-arrows-alt"></i></div>
					</div>
				</transition-group>
			</draggable>
			<button type="button" @click="addField()"><i class="fas fa-plus"></i> Add</button>
		</template>
		<textarea class="fieldValue textarea" v-else-if="useTextarea" v-model="value"></textarea>
		<input class="fieldValue" v-else-if="type === 'boolean'" :checked="!!value" v-model="value" type="checkbox" :name="fieldName" />
		<input class="fieldValue" v-else v-model="value" type="text" :name="fieldName" />
	</div>
</template>

<script>
import draggable from 'vuedraggable';

import VueCtkDateTimePicker from 'vue-ctk-date-time-picker';
import 'vue-ctk-date-time-picker/dist/vue-ctk-date-time-picker.css';

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import areaSelect from "./leaflet-areaselect/leaflet-areaselect.js";
import "./leaflet-areaselect/leaflet-areaselect.css";


import { ProcessGraph } from '@openeo/js-commons';
import Utils from '../utils.js';

export default {
	name: 'ParameterField',
	components: {
		draggable,
		// Asynchronously load the component to avoid circular references.
		// See https://vuejs.org/v2/guide/components-edge-cases.html#Circular-References-Between-Components
		VisualEditor: () => import('./VisualEditor.vue'),
		VueCtkDateTimePicker
	},
	props: {
		field: Object,
		schema: Object,
		pass: {},
		isItem: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			value: null
		}
	},
	computed: {
		type() {
			return this.isItem ? this.schema.arrayOf() : this.schema.dataType();
		},
		useTextarea() {
			return (this.type === 'geojson' || this.type === 'proj-definition' || this.type === 'output-format-options' || this.type === 'process-graph-variables');
		},
		fieldName() {
			return this.field.name + (Array.isArray(this.field.value) ? '[]' : '');
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
		this.initView();
	},
	methods: {
		initView() {
			if (this.type === 'bounding-box') {
				var map = new L.Map('areaSelector');
				var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					name: 'OpenStreetMap',
					attribution: 'Map data &copy; <a href="http://www.osm.org">OpenStreetMap</a>'
				});
				osm.addTo(map);

				var areaSelect = L.areaSelect();
				areaSelect.addTo(map);
				if (Utils.isObject(this.value) && Object.keys(this.value).length >= 4) {
					this.value = L.latLngBounds(
						L.latLng(this.value.south, this.value.west),
						L.latLng(this.value.north, this.value.east)
					);
					areaSelect.setBounds(this.value);
				}
				else {
					map.setView([0,0], 1);
					this.value = areaSelect.getBounds();
				}
				areaSelect.on("change", () => {
					this.value = areaSelect.getBounds();
				});
			}
		},
		initValue() {
			var v;
			if (this.type === 'temporal-interval') {
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
			else if (this.type === 'callback') {
				if (Utils.isObject(this.$props.pass) && this.$props.pass.callback) {
					if (Utils.isObject(this.$props.pass) && this.$props.pass.callback instanceof ProcessGraph) {
						v = this.$props.pass.callback.toJSON();
					}
					else  {
						v = this.$props.pass.callback;
					}
				}
				else {
					v = null;
				}
			}
			else if (this.type === 'array' || this.type === 'temporal-intervals') {
				v = [];
				if (Array.isArray(this.$props.pass)) {
					for(var i in this.$props.pass) {
						v.push({
							id: i,
							value: this.$props.pass[i]
						});
					}
				}
			}
			else if (this.useTextarea) {
				if (typeof this.$props.pass === 'object') {
					if (Utils.size() > 0) {
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
			if (this.type === 'temporal-interval') {
				return [this.value.start, this.value.end];
			}
			else if (this.type === 'callback') {
				var pg = this.$refs.callbackBuilder.makeProcessGraph();
				var obj = new ProcessGraph(pg);
				obj.parse();
				return {
					callback: obj
				};
			}
			else if (this.type === 'bounding-box') {
				return	{
					// Round to 6 decimals, the leading + removes the trailing zeros appended by toFixed.
					west: +this.value.getWest().toFixed(6),
					south: +this.value.getSouth().toFixed(6),
					east: +this.value.getEast().toFixed(6),
					north: +this.value.getNorth().toFixed(6),
				};
			}
			else if (this.type === 'array' || this.type === 'temporal-intervals') {
				var values = [];
				for(var i in this.$refs.arrayFields) {
					values.push(this.$refs.arrayFields[i].getValue());
				}
				return values;
			}
			else if (this.type === 'number') {
				return Number.parseFloat(this.value);
			}
			else if (this.type === 'integer') {
				return Number.parseInt(this.value);
			}
			else if (this.type === 'null') {
				return null;
			}
			else if (this.useTextarea) {
				if (typeof this.value === 'string' && this.value.length > 0) {
					return JSON.parse(this.value);
				}
				else {
					return null;
				}
			}
			else {
				return this.value;
			}
		},
		addField() {
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
.arrayElement {
	transition: all 0.5s;
}

.arrayElements-enter, .arrayElements-active {
	opacity: 0;
}

.mover {
	padding: 3px 1em;
}
#areaSelector {
	height: 500px;
}
.textarea {
	width: 100%;
	height: 200px;
}
.border {
	border: 1px solid #ccc;
}
</style>
