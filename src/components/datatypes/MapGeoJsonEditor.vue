<template>
	<div :id="id"></div>
</template>

<script>
import MapMixin from '../maps/MapMixin.vue';
import GeoJsonMixin from '../maps/GeoJsonMixin.vue';

import GeoJSON from 'ol/format/GeoJSON';
import Snap from 'ol/interaction/Snap';

import 'ol-ext/control/Bar.css';
import Bar from 'ol-ext/control/Bar';
import Button from 'ol-ext/control/Button';
import 'ol-ext/control/EditBar.css';
import EditBar from 'ol-ext/control/EditBar';
import UndoRedo from 'ol-ext/interaction/UndoRedo';

export default {
	name: 'MapGeoJsonEditor',
	mixins: [MapMixin, GeoJsonMixin],
	props: {
		value: {
			type: Object,
			default: null
		}
	},
	data() {
		return {
			geoJsonLayer: null
		};
	},
	methods: {
		showMap() {
			if (this.show) {
				this.$nextTick(this.renderMap);
			}
		},
		renderMap() {
			this.createMap(false, 'EPSG:4326');

			if (!this.editable) {
				this.geoJsonLayer = this.addGeoJson(this.value);
			}
			else {
				this.geoJsonLayer = this.geoJsonEditor(this.value);
			}

			if (this.editable) {
				var callback = () => this.$emit('input', this.getGeoJson());
				this.geoJsonLayer.getSource().on('change', callback);
			}
		},

		geoJsonEditor(geojson) {
			var layer = this.addGeoJson(geojson);

			var mainbar = new Bar();
			this.map.addControl(mainbar);

			// Editbar
			var editbar = new EditBar ({
				source: layer.getSource(),
				interactions: {
					Info: false,
					DrawHole: false,
					Offset: false,
					Split: false
				}
			});
			mainbar.addControl(editbar);

			// Undo redo interaction
			var undoInteraction = new UndoRedo();
			this.map.addInteraction(undoInteraction);
			// Prevent selection of a deleted feature
			undoInteraction.on('undo', e => {
				if (e.action.type === 'addfeature') {
					editbar.getInteraction('Select').getFeatures().clear();
					editbar.getInteraction('Transform').select();
				}
			});

			// Add buttons to the bar
			var bar = new Bar({ 
				group: true,
				controls: [
					new Button({
						html: '<i class="fas fa-undo-alt"></i>',
						title: 'Undo',
						handleClick: () => undoInteraction.undo()
					}),
					new Button({
						html: '<i class="fas fa-redo-alt"></i>',
						title: 'Redo',
						handleClick: () => undoInteraction.redo()
					})
				]
			});
			mainbar.addControl(bar);

			// Add snap functionality
			this.map.addInteraction(new Snap({ 
				source: layer.getSource() 
			}));

			return layer;
		},

		getGeoJson() {
			var geojson = new GeoJSON();
			var olFeatures = this.geoJsonLayer.getSource().getFeatures();
			var gjFeatures = [];
			for(var i in olFeatures) {
				gjFeatures.push(geojson.writeFeatureObject(
					olFeatures[i],
					{
						dataProjection: 'EPSG:4326',
						featureProjection: this.map.getView().getProjection()
					}
				));
			}
			if (gjFeatures.length === 0) {
				return null;
			}
			else if (gjFeatures.length === 1) {
				if (!gjFeatures[0].properties && gjFeatures[0].geometry) {
					return gjFeatures[0].geometry;
				}
				else {
					return gjFeatures[0];
				}
			}
			else {
				return {
					type: "FeatureCollection",
					features: gjFeatures
				};
			}
		}

	}

}
</script>

<style src="../maps/MapMixin.css"></style>