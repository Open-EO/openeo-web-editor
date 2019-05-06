<template>
	<div class="fieldEditorContainer">
		<select class="fieldValue" v-if="schema.isEnum()" :name="fieldName" v-model="value">
			<option v-for="(choice, k) in schema.getEnumChoices()" :key="k" :value="choice">{{ choice }}</option>
		</select>
		<template v-else-if="type === 'temporal-interval'">
			<VueCtkDateTimePicker v-model="value" :range="true" label="Select start and end time" format="YYYY-MM-DD[T]HH:mm:ss[Z]"></VueCtkDateTimePicker>
			<!-- ToDo: Support open date ranges, probably by using two separate date pickers -->
		</template>
		<template v-else-if="type === 'bounding-box'">
			<div id="areaSelector"></div>
		</template>
		<template v-else-if="type === 'callback'">
			<GraphBuilderEnvironment ref="callbackBuilder" />
		</template>
		<template v-else-if="type === 'null'">
			The field will be set to <strong><tt>null</tt></strong>.
		</template>
		<template v-else-if="type === 'array'">
			<draggable v-model="value">
				<transition-group name="arrayElements">
					<div class="fieldValue arrayElement" v-for="(e, k) in value" :key="e.id">
						<EditorField ref="arrayFields" :field="field" :pass="e.value" :isItem="true" />
						<button type="button" @click="removeField(k)"><i class="fas fa-trash"></i></button>
						<div class="mover"><i class="fas fa-arrows-alt"></i></div>
					</div>
				</transition-group>
			</draggable>
			<button type="button" @click="addField()"><i class="fas fa-plus"></i> Add</button>
		</template>
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


import GraphBuilderEnvironment from './GraphBuilderEnvironment.vue';

export default {
	name: 'EditorField',
	components: {
		draggable,
		GraphBuilderEnvironment,
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
		var v;
		if (this.type === 'temporal_extent' && Array.isArray(this.$props.pass) && this.$props.pass.length >= 2) {
			v = {
				start: this.$props.pass[0],
				end: this.$props.pass[1]
			};
		}
		else if (this.type === 'array') {
			v = [];
			for(var i in this.$props.pass) {
				v.push({
					id: i,
					value: this.$props.pass[i]
				});
			}
		}
		else {
			v = this.$props.pass;
		}
		return {
			value: v
		};
	},
	mounted() {
		if (this.type === 'spatial_extent') {
			var map = new L.Map('areaSelector');
			var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				name: 'OpenStreetMap',
				attribution: 'Map data &copy; <a href="http://www.osm.org">OpenStreetMap</a>'
			});
			osm.addTo(map);

			var areaSelect = L.areaSelect();
			areaSelect.addTo(map);
			if (this.$utils.isObject(this.value) && Object.keys(this.value).length >= 4) {
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
	computed: {
		fieldName() {
			return this.field.name + (this.field.isArray ? '[]' : '');
		},
		type() {
			return this.schema.dataType();
		}
	},
	methods: {
		getValue() {
			var types = this.types();
			if (this.type === 'temporal_extent') {
				return [this.value.start, this.value.end];
			}
			else if (this.type === 'spatial_extent') {
				return	{
					// Round to 6 decimals, the leading + removes the trailing zeros appended by toFixed.
					west: +this.value.getWest().toFixed(6),
					south: +this.value.getSouth().toFixed(6),
					east: +this.value.getEast().toFixed(6),
					north: +this.value.getNorth().toFixed(6),
				};
			}
			else if (this.type === 'array') {
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
				return Number.parseInt(this.value);
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
</style>
