<template>
	<div :id="id"></div>
</template>

<script>
import MapMixin from './MapMixin.vue';
import GeoJsonMixin from './GeoJsonMixin.vue';
import Utils from '../../utils.js';

import Feature from 'ol/Feature';
import { fromExtent as PolygonFromExtent } from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

export default {
	name: 'MapExtentViewer',
	mixins: [MapMixin, GeoJsonMixin],
	props: {
		footprint: {
			// bbox: Array of Array (west, south, east, north - WGS84)
			// geometry: GeoJSON Object (WGS84)
			type: [Array, Object],
			default: () => null
		}
	},
	methods: {
		renderMap() {
			// ToDo: Set EPSG:3857 as projection if extent or geojson does not exceed bounds of EPSG:3857
			this.createMap(false, "EPSG:4326");

			if (Array.isArray(this.footprint) && this.footprint.length > 0) {
				for(let extent of this.footprint) {
					var bbox = Utils.extentToBBox(extent);
					this.addRectangle(bbox.west, bbox.east, bbox.north, bbox.south);
				}
			}
			else if (Utils.isObject(this.footprint)) {
				this.addGeoJson(this.footprint);
			}
		},

		addRectangle(w, e, n, s) {
			let extent = [w, s, e, n];
			let layer = new VectorLayer({
				title: "Extent",
				displayInLayerSwitcher: false,
				source: new VectorSource({
					features: [
						new Feature(PolygonFromExtent(extent))
					],
					projection: "EPSG:4326",
					wrapX: false
				})
			});
			this.map.addLayer(layer);
			this.map.getView().fit(extent, this.getFitOptions());
			// ToDo: The Collection component has some smart fitting behavior in setMapSize()
			// Implement something similar here, too.
		}

	}

}
</script>

<style src="./MapMixin.css"></style>