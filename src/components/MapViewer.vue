<template>
	<div id="mapCanvas"></div>
</template>

<script>
import EventBus from '../eventbus.js';

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { leafletGeotiff, LeafletGeotiffRenderer } from "leaflet-geotiff/leaflet-geotiff.js";
import "leaflet-fullscreen/dist/leaflet.fullscreen.css";
import fullscreen from "leaflet-fullscreen";
import sideBySide from "leaflet-side-by-side";

export default {
	name: 'MapViewer',

	data() {
		return {
			options: {
				fullscreenControl: true,
				center: [45,15], // [50.1725,9.15]
				zoom: 8 // 4
			},
			map: null,
			baseLayer: {
				osm: null
			},
			layer: {},
			layerControl: null,
			sideBySideComponent: null
		}
	},

	mounted() {
		this.createMap();
		EventBus.$on('viewWebService', this.viewWebService);
		EventBus.$on('removeWebService', this.removeWebService);
	},

	methods: {
		createMap() {
			this.map = new L.Map('mapCanvas', this.options);

			// Add layer control
			this.layerControl = L.control.layers();
			this.layerControl.addTo(this.map);

			// Add base layers
			this.baseLayer.osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				name: 'OpenStreetMap',
				attribution: 'Map data &copy; <a href="http://www.osm.org">OpenStreetMap</a>'
			});
			this.baseLayer.osm.addTo(this.map);
			this.layerControl.addBaseLayer(this.baseLayer.osm, this.baseLayer.osm.options.name);

			this.map.on('layeradd', this.oNLayerAdd);
			this.map.on('overlayremove', this.onOverlayRemove);
		},

		oNLayerAdd(evt) {
			var shownLayers = this.getShownLayers();
			if (shownLayers.length == 2 && this.sideBySideComponent === null) {
				this.sideBySideComponent = L.control.sideBySide(shownLayers[0], shownLayers[1]);
				this.sideBySideComponent.addTo(this.map);
			}
		},

		onOverlayRemove(evt) {
			var shownLayers = this.getShownLayers();
			if (shownLayers.length != 2 && this.sideBySideComponent !== null) {
				this.map.removeControl(this.sideBySideComponent);
				this.sideBySideComponent = null;
			}
		},

		getShownLayers() {
			var shownLayers = [];
			for(var id in this.layer) {
				if (this.map.hasLayer(this.layer[id])) {
					shownLayers.push(this.layer[id]);
				}
			}
			return shownLayers;
		},

		viewWebService(service) {
			switch(service.type.toLowerCase()) {
				case 'wms':
					this.updateWMSLayer(service);
					break;
				case 'xyz':
					this.updateXYZLayer(service);
					break;
				default:
					this.$utils.error('Sorry, the service type is not supported by the map.');
			}
		},

		removeWebService(id) {
			if(this.layer[id]) {
				this.removeLayerFromMap(id);
			}
		},

		addLayerToMap(id) {
			this.layer[id].addTo(this.map);
			this.layerControl.addOverlay(this.layer[id], this.layer[id].options.name);
		},

		removeLayerFromMap(id) {
			this.layer[id].removeFrom(this.map);
			this.layerControl.removeLayer(this.layer[id]);
			delete this.layer[id];
		},

		removeOldLayer(except) {
			for(var id in this.layer) {
				if (this.layer[id] !== null && this.layer[id] !== except) {
					this.removeLayerFromMap(id);
				}
			}
		},

		updateTiffLayerBlob(blob) {
			this.updateTiffLayer(URL.createObjectURL(blob));
		},

		updateTiffLayer(url) {
			var id = this.$utils.formatDateTime(Date.now());
			if (typeof this.layer[id] === 'undefined') {
				var renderer = LeafletGeotiffRenderer();
				var opts = {
					name: id + ' (GeoTiff)',
					renderer: renderer
				};
				this.layer[id] = leafletGeotiff(url, opts);
				this.addLayerToMap(id);
			}
			else {
				this.layer[id].setURL(url);
			}
		},

		updateXYZLayer(service) {
			var id = service.serviceId;
			var url = service.url + "/{z}/{x}/{y}";
			if (typeof this.layer[id] === 'undefined') {
				var opts = {
					name: id.toUpperCase().substr(0,6) + " (XYZ)"
				};
				this.layer[id] = new L.TileLayer(url, opts);
				this.addLayerToMap(id);
			}
			else {
				this.layer[id].setUrl(url, false);
			}
		},

		updateWMSLayer(service) {
			var id = service.serviceId;
			if (typeof this.layer[id] === 'undefined') {
				var args = service.attributes;
				args.name = id.toUpperCase().substr(0,6) + " (WMS)";
				args.service = args.service || 'WMS';
				args.format = args.format || 'image/jpeg';
				this.layer[id] = L.tileLayer.wms(service.url, args);
				this.addLayerToMap(id);
			}
			else {
				this.layer[id].setUrl(service.url, false);
			}
		}

	}

}
</script>

<style scoped>
#mapCanvas {
	height: 100%;
}
</style>