<template>
	<div class="geojson-editor" @drop="onDrop" @dragover="allowDrop">
		<Tabs ref="tabs" id="geojson-tabs" position="bottom">
			<Tab id="map" name="Map" icon="fa-map" :selected="true" @show="showMap">
				<GeoJsonMapEditor :editable="editable" ref="map" v-model="data" />
			</Tab>
			<Tab id="source" name="Code" icon="fa-code" @show="showCode">
				<TextEditor ref="sourceEditor" :editable="editable" v-model="data" id="geojson-texteditor" language="json"></TextEditor>
			</Tab>
		</Tabs>
	</div>
</template>

<script>
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import Tab from '@openeo/vue-components/components/Tab.vue';

import GeoJsonMapEditor from '../maps/GeoJsonMapEditor.vue';
import TextEditor from '../TextEditor.vue';

import Utils from '../../utils';

import { kml } from "@tmcw/togeojson";

export default {
	name: 'GeoJsonEditor',
	components: {
		GeoJsonMapEditor,
		Tab,
		Tabs,
		TextEditor
	},
	data() {
		return {
			data: this.value
		};
	},
	props: {
		editable: {
			type: Boolean,
			default: true
		},
		value: {
			type: Object,
			default: null
		}
	},
	watch: {
		value(value) {
			this.data = value;
		},
		data(data) {
			this.$emit('input', data);
		}
	},
	methods: {
		showMap() {
			this.$refs.map.renderMap();
		},
		showCode() {
			this.$refs.sourceEditor.updateState();
		},
		allowDrop(event) {
			if (this.editable) {
				event.preventDefault();
			}
		},
		onDrop(event) {
			// Read a files that have been dropped
			let files = event.dataTransfer.files;
			if (files.length === 1) {
				let file = event.dataTransfer.files[0];
				let geojsonTypes = ['text/json', 'application/json', 'application/geo+json', 'text/plain'];
				let kmlTypes = ['text/xml', 'application/xml', 'application/vnd.google-earth.kml+xml'];
				let name = file.name.toLowerCase();
				let isGeoJson = geojsonTypes.includes(file.type) || name.endsWith('.geojson') || name.endsWith('.json');
				let isKml = kmlTypes.includes(file.type) || name.endsWith('.kml') || name.endsWith('.xml');
				if (isGeoJson || isKml) {
					var reader = new FileReader();
					reader.onload = async e => {
						let geojson;
						if (isKml) {
							try {
								geojson = kml(new DOMParser().parseFromString(e.target.result, "text/xml"));
							} catch(error) {
								console.error(error);
								return Utils.error(this, "The provided file is not a valid KML file");
							}
						}
						else {
							try {
								geojson = JSON.parse(e.target.result);
							} catch(error) {
								console.error(error);
								return Utils.error(this, "The provided file is not a valid JSON file");
							}
						}
						if (Utils.detectGeoJson(geojson)) {
							this.data = geojson;
							if (this.$refs.map) {
								this.$refs.map.renderMap();
							}
						}
						else {
							Utils.error(this, "The provided file doesn't seem to be a GeoJSON file");
						}
					};
					reader.onerror = error => Utils.exception(this, error, "Reading the file failed");
					reader.readAsText(file, "UTF-8");
				}
			}
			else {
				Utils.error(this, "Please provide a single JSON or GeoJSON file");
			}
			return event.preventDefault();
		},
	}

}
</script>

<style src="../maps/MapMixin.scss" lang="scss"></style>

<style lang="scss" scoped>
.geojson-editor {
	max-width: 100%;
}
</style>