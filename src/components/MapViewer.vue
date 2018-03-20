<template>
	<div id="mapCanvas"></div>
</template>

<script>
import EventBus from '../eventbus.js';

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { leafletGeotiff, LeafletGeotiffRenderer } from "leaflet-geotiff/leaflet-geotiff.js";
import customRenderer from "../leaflet-geotiff-customrenderer.js";
import "leaflet.control.layers.tree/L.Control.Layers.Tree.css";
import layerControl from "leaflet.control.layers.tree";
import "leaflet-fullscreen/dist/leaflet.fullscreen.css";
import fullscreen from "leaflet-fullscreen";

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
			layer: {
				wms: null,
				tiff: null
			},
			layerControl: null
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
			this.layerControl = L.control.layers.tree({});
			this.layerControl.addTo(this.map);
			this.layerControl.expandTree();
			this.map.on('layeradd', this.updateLayerTree);
			this.map.on('layerremove', this.updateLayerTree);

			// Add base layers
			this.baseLayer.osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				name: 'OpenStreetMap',
				attribution: 'Map data &copy; <a href="http://www.osm.org">OpenStreetMap</a>'
			});
			this.baseLayer.osm.addTo(this.map);
		},

		updateLayerTree() {
			var baseLayer = {
				label: 'Base Layer',
				children: [],
			};
			for(var i in this.baseLayer) {
				baseLayer.children.push({
					label: this.baseLayer[i].options.name,
					layer: this.baseLayer[i]
				});
			}

			var dataLayer = {
				label: 'Data Layers',
				children: [],
			};
			for(var i in this.layer) {
				if (this.layer[i] === null) {
					continue;
				}
				dataLayer.children.push({
					label: this.layer[i].options.name,
					layer: this.layer[i]
				});
			}

			var tree = [baseLayer];
			if (dataLayer.children.length > 0) {
				tree.push(dataLayer);
			}
			this.layerControl.setBaseTree(tree);
		},

		viewWebService(service) {
			if (service.service_type.toLowerCase() == 'wms') {
				this.updateWMSLayer(service);
			}
			else {
				this.$utils.error('Sorry, the requested service type is not supported by the map.');
			}
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
			this.removeOldLayer(this.layer.tiff);
			if (!this.layer.tiff) {
				var renderer = customRenderer();
				var opts = {
					name: 'GeoTiff',
					renderer: renderer
				};
				this.layer.tiff = leafletGeotiff(url, opts);
				this.layer.tiff.addTo(this.map);
				EventBus.$emit('evalScript', (script) => {
					renderer.setScript(script);
				});
			}
			else {
				this.layer.tiff.setURL(url);
			}
		},

		updateWMSLayer(service) {
			this.removeOldLayer(this.layer.wms);
			if (!this.layer.wms) {
				this.createWMSLayer(service);
			}
			else {
				this.layer.wms.setUrl(service.service_url, false);
				this.layer.wms.recolor();
			}
		},

		createWMSLayer(service) {
			var self = this;

			var args = service.service_args;
			if (!args.name) {
				args.name = 'WMS';
			}
			if (!args.service) {
				args.service = 'WMS';
			}
			if (!args.format) {
				args.format = 'image/jpeg';
			}

			this.layer.wms = L.tileLayer.wms(service.service_url, args);

			this.layer.wms.recolor = function () {
				for (var key in this._tiles) {
					var tile = this._tiles[key];
					self.recolor(tile.el);
				}
			};

			this.layer.wms.createTile = function (coords) {
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

			this.layer.wms.addTo(this.map);
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