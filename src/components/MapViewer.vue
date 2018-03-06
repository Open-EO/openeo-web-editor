<template>
	<div id="mapCanvas"></div>
</template>

<script>
import EventBus from '../eventbus.js';

import "leaflet/dist/leaflet.css"
import L from "leaflet"
import leafletGeotiff from "leaflet-geotiff/leaflet-geotiff.js"

export default {
	name: 'MapViewer',

	data() {
		return {
			options: {
				center: [45,15],
				zoom: 8
			},
			map: null,
			layer: {
				wms: null,
				tiff: null
			}
		}
	},

	mounted() {
		this.createMap();
		EventBus.$on('viewWebService', this.viewWebService);
	},

	methods: {
		createMap() {
			this.map = new L.Map('mapCanvas', this.options);
			L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: 'Map data &copy; <a href="http://www.osm.org">OpenStreetMap</a>'
			}).addTo(this.map);
		},

		viewWebService(service) {
			if (service.service_type.toLowerCase() == 'wms') {
				this.updateWMSLayer(service.service_url);
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
				var opts = {
					name: 'GeoTiff'
				};
				this.layer.tiff = leafletGeotiff(url, opts);
				this.layer.tiff.addTo(this.map);
			}
			else {
				this.layer.tiff.setURL(url);
			}
		},

		updateWMSLayer(url) {
			this.removeOldLayer(this.layer.wms);
			if (!this.layer.wms) {
				this.createWMSLayer(url);
			}
			else {
				this.layer.wms.setUrl(url, false);
				this.layer.wms.recolor();
			}
		},

		createWMSLayer(url) {
			var self = this;

			this.layer.wms = L.tileLayer.wms(url, {
				request: 'GetCoverage',
				service: 'WMS',
				coverage: 'CUSTOM',
				format: 'image/jpeg',
				tileSize: 256,
				minZoom: 8
			});

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