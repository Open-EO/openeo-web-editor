<template>
	<Tabs class="geojson-editor" ref="tabs" id="geojson-tabs" position="bottom">
		<Tab id="map" name="Map" icon="fa-map" :selected="true" @show="showMap">
			<GeoJsonMapEditor :editable="editable" ref="map" :value="value" @input="commit" />
		</Tab>
		<Tab id="source" name="Code" icon="fa-code" @show="showCode">
			<TextEditor ref="sourceEditor" :editable="editable" :value="value" @input="commit" id="geojson-texteditor" language="json"></TextEditor>
		</Tab>
	</Tabs>
</template>

<script>
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import Tab from '@openeo/vue-components/components/Tab.vue';

import GeoJsonMapEditor from '../maps/GeoJsonMapEditor.vue';
import TextEditor from '../TextEditor.vue';

export default {
	name: 'GeoJsonEditor',
	components: {
		GeoJsonMapEditor,
		Tab,
		Tabs,
		TextEditor
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
	data() {
		return {
		};
	},
	methods: {
		showMap() {
			this.$refs.map.renderMap();
		},
		showCode() {
			this.$refs.sourceEditor.updateState();
		},
		commit(value) {
			this.$emit('input', value); 
		}
	}

}
</script>

<style src="../maps/MapMixin.css"></style>