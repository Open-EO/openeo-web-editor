<template>
	<div :id="id"></div>
</template>

<script>
import MapMixin from './MapMixin.vue';
import Utils from '../utils.js';

import Feature from 'ol/Feature';
import { fromExtent as PolygonFromExtent } from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import TileJSON from 'ol/source/TileJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';

import 'ol-ext/control/Swipe.css';
import Swipe from 'ol-ext/control/Swipe';

export default {
	name: 'MapViewer',
	mixins: [MapMixin],
	props: {
		extents: { // Array of Array (WGS84: west, south, east, north)
			type: Array,
			default: () => null
		},
		geoJson: {
			type: Object,
			default: () => null
		}
	},
	data() {
		return {
			userLayers: {},
			swipe: {
				control: null,
				left: null,
				right: null
			}
		}
	},
	methods: {
		renderMap() {
			let showExtents = Array.isArray(this.extents) && this.extents.length > 0;
			this.createMap(!showExtents);

			if (showExtents) {
				for(let extent of this.extents) {
					var bbox = Utils.extentToBBox(extent);
					this.addRectangle(bbox.west, bbox.east, bbox.north, bbox.south);
				}
			}

			if (Utils.isObject(this.geoJson)) {
				this.geoJsonLayer = this.addGeoJson(this.geoJson);
			}
		},

		addRectangle(w, e, n, s) {
			var extent = [...fromLonLat([w, s]), ...fromLonLat([e, n])];
			this.map.addLayer(new VectorLayer({
				title: "Extent",
				displayInLayerSwitcher: false,
				source: new VectorSource({
					features: [
						new Feature(PolygonFromExtent(extent))
					],
					wrapX: false
				})
			}));
			this.map.getView().fit(extent);
			// ToDo: The Collection component has some smart fitting behavior in setMapSize()
			// Implement something similar here, too.
		},

		getVisibleLayers() {
			var shownLayers = [];
			for(var id in this.userLayers) {
				if (this.userLayers[id].getVisible()) {
					shownLayers.push(id);
				}
			}
			return shownLayers;
		},

		showWebService(service) {
			switch(service.type.toLowerCase()) {
				case 'xyz':
					this.updateXYZLayer(service);
					break;
				default:
					Utils.error(this, 'Sorry, the service type is not supported by the map.');
			}
		},

		toggleSwipeControl() {
			var shownLayers = this.getVisibleLayers();
			if (shownLayers.length === 2) {
				if (this.swipe.control === null) {
					this.swipe.control = new Swipe();
					this.map.addControl(this.swipe.control);
				}
				if (this.swipe.left !== shownLayers[0]) {
					this.swipe.control.addLayer(this.userLayers[shownLayers[0]]);
					this.swipe.left = shownLayers[0];
				}
				if (this.swipe.right !== shownLayers[1]) {
					this.swipe.control.addLayer(this.userLayers[shownLayers[1]], true);
					this.swipe.right = shownLayers[1];
				}
			}
			else {
				this.map.removeControl(this.swipe.control);
				this.swipe.control = null;
				this.swipe.left = null;
				this.swipe.right = null;
			}
		},

		addLayerToMap(id, layer) {
			this.userLayers[id] = layer;
			this.map.addLayer(layer);
			this.toggleSwipeControl();
			layer.on('change', () => this.toggleSwipeControl());
			layer.on('change:visible', () => this.toggleSwipeControl());
			layer.on('change:zIndex', () => this.toggleSwipeControl());
		},

		removeLayerFromMap(id) {
			if (!this.userLayers[id]) {
				return;
			}
			this.map.removeLayer(this.userLayers[id]);
			delete this.userLayers[id];
			this.toggleSwipeControl();
		},

		updateGeoTiffLayer(url, title = null) {
			var layer = new TileLayer({
				source: new TileJSON({
					url: 'http://tiles.rdnt.io/tiles?url=' + encodeURIComponent(url),
					crossOrigin: 'anonymous'
				})
			});
			this.addLayerToMap(title ? title : "GeoTiff", layer);
			// ToDo: Implement full/native GTiff support
		},

		updateXYZLayer(service) {
			var id = service.id;
			var url = service.url;
			var title = Utils.getResourceTitle(service, "Service") + " (XYZ)";
			if (typeof this.userLayers[id] === 'undefined') {
				var layer = new TileLayer({
					source: this.trackTileProgress(new XYZ({
						url: url
					})),
					title: title
				});
				this.addLayerToMap(id, layer);
			}
			else {
				// Replace/add a query parameter with a unique ID so that OpenLayers doesn't load tiles from cache
				var newUrl = Utils.replaceParam(url, '__editorSessionId', new Date().getTime());
				// Make sure { and } are not url-encoded
				newUrl = newUrl.replace(/%7B/g, '{').replace(/%7D/g, '}');
				// Set new URL to reload tiles
				this.userLayers[id].getSource().setUrl(newUrl);
			}
		}

	}

}
</script>

<style src="./MapMixin.css"></style>