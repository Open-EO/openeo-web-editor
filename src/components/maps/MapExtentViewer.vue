<template>
	<div :id="id"></div>
</template>

<script>
import MapMixin from './MapMixin.vue';
import GeoJsonMixin from './GeoJsonMixin.vue';
import Utils from '../../utils.js';

import Feature from 'ol/Feature';
import { fromExtent as PolygonFromExtent } from 'ol/geom/Polygon';
import { isEmpty as extentIsEmpty } from 'ol/extent';
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
			let isBBox = Array.isArray(this.footprint) && this.footprint.length > 0;
			let isGeoJson = Utils.detectGeoJson(this.footprint);

			// Check max bounds and whether we can use Web Mercaror or WGS84
			let value;
			let isWebMercatorCompatible = true;
			if (isBBox) {
				value = this.footprint.map(bbox => Utils.extentToBBox(bbox));
				isWebMercatorCompatible = Utils.isBboxInWebMercator(value) !== false;
			}
			else if (isGeoJson) {
				let source = this.createGeoJsonSource(geojson);
				let extent = source.getExtent();
				value = geojson;
				if (!extentIsEmpty(extent)) {
					isWebMercatorCompatible = Utils.isBboxInWebMercator(Utils.extentToBBox(extent)) !== false;
					if (!isWebMercatorCompatible) {
						value = source;
					}
				}
			}

			this.createMap(isWebMercatorCompatible ? "EPSG:3857" : "EPSG:4326");
			this.addBasemaps();
			if (isBBox) {
				value.forEach(bbox => this.addRectangle(bbox.west, bbox.east, bbox.north, bbox.south));
			}
			else if (isGeoJson) {
				this.addGeoJson(value);
			}
		},

		addRectangle(w, e, n, s) {
			let mapProj = this.map.getView().getProjection();
			let polygon = PolygonFromExtent([w, s, e, n]).transform("EPSG:4326", mapProj);
			let layer = new VectorLayer({
				title: "Extent",
				displayInLayerSwitcher: false,
				source: new VectorSource({
					features: [
						new Feature(polygon)
					],
					projection: mapProj,
					wrapX: false
				})
			});
			this.map.addLayer(layer);
			this.map.getView().fit(polygon.getExtent(), this.getFitOptions());
			// ToDo: The Collection component has some smart fitting behavior in setMapSize()
			// Implement something similar here, too.
		}

	}

}
</script>

<style src="./MapMixin.css"></style>