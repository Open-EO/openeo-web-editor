<template>
	<div id="mapCanvas"></div>
</template>

<script>
import EventBus from '../eventbus.js';

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { leafletGeotiff, LeafletGeotiffRenderer } from "leaflet-geotiff/leaflet-geotiff.js";
import customRenderer from "../leaflet-geotiff-customrenderer.js";
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
			for(var i in this.layer) {
				if (this.map.hasLayer(this.layer[i])) {
					shownLayers.push(this.layer[i]);
				}
			}
			return shownLayers;
		},

		viewWebService(service) {
			if (service.service_type.toLowerCase() == 'wms') {
				this.updateWMSLayer(service);
			}
			else if (service.service_type.toLowerCase() == 'xyz') {
				this.updateXYZLayer(service);
			}
			else {
				this.$utils.error('Sorry, the requested service type is not supported by the map.');
			}
		},

		addLayerToMap(layer) {
			layer.addTo(this.map);
			this.layerControl.addOverlay(layer, layer.options.name);
		},

		removeOldLayer(except) {
			for(var i in this.layer) {
				if (this.layer[i] !== null && this.layer[i] !== except) {
					this.map.removeLayer(this.layer[i]);
					this.layer[i] = null;
				}
			}
		},

		updateTiffLayerBlob(blob) {
			this.updateTiffLayer(URL.createObjectURL(blob));
		},

		updateTiffLayer(url) {
			var id = this.$utils.formatDateTime(Date.now());
			if (typeof this.layer[id] === 'undefined') {
				var renderer = customRenderer();
				var opts = {
					name: id + ' (GeoTiff)',
					renderer: renderer
				};
				this.layer[id] = leafletGeotiff(url, opts);
				this.addLayerToMap(this.layer[id]);
				EventBus.$emit('evalScript', (script) => {
					renderer.setScript(script);
				});
			}
			else {
				this.layer[id].setURL(url);
			}
		},

		updateXYZLayer(service) {
			var id = service.service_id;
			var url = service.service_url + "/{z}/{x}/{y}";
			if (typeof this.layer[id] === 'undefined') {
				var opts = {
					name: id + " (XYZ)"
				};
				this.layer[id] = new L.TileLayer(url, opts);
				this.extendTileLayerForVisualizations(this.layer[id]);
				this.addLayerToMap(this.layer[id]);
			}
			else {
				this.layer[id].setUrl(url, false);
				this.layer[id].recolor();
			}
		},

		updateWMSLayer(service) {
			var id = service.service_id;
			if (typeof this.layer[id] === 'undefined') {
				var args = service.service_args;
				args.name = id + " (WMS)";
				args.service = args.service || 'WMS';
				args.format = args.format || 'image/jpeg';
				this.layer[id] = L.tileLayer.wms(service.service_url, args);
				this.extendTileLayerForVisualizations(this.layer[id]);
				this.addLayerToMap(this.layer[id]);
			}
			else {
				this.layer[id].setUrl(service.service_url, false);
				this.layer[id].recolor();
			}
		},

		extendTileLayerForVisualizations(layer) {
			var self = this;

			layer.recolor = function () {
				for (var key in this._tiles) {
					var tile = this._tiles[key];
					self.recolor(tile.el);
				}
			};

			layer.createTile = function (coords) {
				const tile = L.DomUtil.create('canvas', 'leaflet-tile');
				tile.width = tile.height = this.options.tileSize;

				const imageObj = new Image();
				imageObj.crossOrigin = '';
				imageObj.onload = function () {
					const ctx = tile.getContext('2d');
					ctx.drawImage(imageObj, 0, 0);
					tile.originalImage = ctx.getImageData(0, 0, tile.width, tile.height);
					self.recolor(tile);
				};
				imageObj.src = this.getTileUrl(coords);
				return tile;
			};
		},

		recolor(tile) {
			EventBus.$emit('evalScript', (script) => {
				this.$utils.recolorImage(tile, script);
			});
		}

	}

}
</script>

<style scoped>
#mapCanvas {
	height: 100%;
}
</style>