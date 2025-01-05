<template>
	<div :id="id" class="map-extent">
		<ProgressControl ref="progress" :map="map" />
	</div>
</template>

<script>
import MapMixin from './MapMixin.vue';
import StacExtentMixin from './ExtentMixin.vue';
import Utils from '../../utils.js';

import { isEmpty as extentIsEmpty } from 'ol/extent';

export default {
	name: 'MapExtentViewer',
	mixins: [MapMixin, StacExtentMixin],
	props: {
		footprint: {
			// bbox: Array of Array (west, south, east, north - WGS84)
			// geometry: GeoJSON Object (WGS84)
			type: [Array, Object],
			default: () => null
		},
		fill: {
			type: Boolean,
			default: true
		}
	},
	watch: {
		footprint() {
			this.renderMap();
		}
	},
	methods: {
		async renderMap() {
			let data;
			if (Utils.isObject(this.footprint) && this.footprint.type === 'Collection') {
				data = this.footprint.extent.spatial.bbox;
			}
			else {
				data = this.footprint;
			}

			// Check max bounds and whether we can use Web Mercaror or WGS84
			let value;
			let isWebMercatorCompatible = true;
			if (Array.isArray(data) && data.length > 0) {
				value = data.map(bbox => Utils.extentToBBox(bbox));
				isWebMercatorCompatible = Utils.isBboxInWebMercator(value) !== false;
			}
			else {
				let source = this.createGeoJsonSource(data);
				let extent = source.getExtent();
				value = data;
				if (!extentIsEmpty(extent)) {
					isWebMercatorCompatible = Utils.isBboxInWebMercator(Utils.extentToBBox(extent)) !== false;
					if (!isWebMercatorCompatible) {
						value = source;
					}
				}
			}

			await this.createMap(isWebMercatorCompatible ? "EPSG:3857" : "EPSG:4326");
			this.addBasemaps();
			this.addExtent(value, this.fill);
		}

	}

}
</script>

<style src="./MapMixin.scss" lang="scss"></style>