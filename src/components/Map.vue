<template>
  <div id="mapCanvas"></div>
</template>

<script>
import EventBus from '../eventbus.js';

import "leaflet/dist/leaflet.css"
import L from "leaflet"

export default {
	name: 'Map',

	data() {
		return {
			options: {
				center: [45,15],
				zoom: 8
			},
			map: null,
			tiles: null
		}
	},

	mounted() {
		this.createMap();
		EventBus.$on('updateMapTilesWithUrl', this.updateTileLayer);
	},

	methods: {
		createMap() {
			this.map = new L.Map('mapCanvas', this.options);
			L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: 'Map data &copy; <a href="http://www.osm.org">OpenStreetMap</a>'
			}).addTo(this.map);
		},

		updateTileLayer(url) {
			if (!this.tiles) {
				this.createTileLayer(url);
			}
			else {
				this.tiles.setUrl(url, false);
				this.tiles.recolor();
			}
		},

		createTileLayer(url) {
			var self = this;

			// 'http://localhost:8000/download/placeholder/wcs'
			this.tiles = L.tileLayer.wms(url, {
				request: 'GetCoverage',
				service: 'WCS',
				coverage: 'CUSTOM',
				format: 'image/jpeg',
				tileSize: 256,
				minZoom: 8
			});

			this.tiles.recolor = function () {
				for (var key in this._tiles) {
					var tile = this._tiles[key];
					self.recolor(tile.el);
				}
			};

			this.tiles.createTile = function (coords) {
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

			this.tiles.addTo(this.map);

		},

		recolor(tile) {
			if (!tile.originalImage || !this.$OpenEO.Editor.Visualization || !this.$OpenEO.Editor.Visualization.function) {
				return;
			}
			
			const ctx = tile.getContext('2d');
			const tgtData = ctx.getImageData(0, 0, tile.width, tile.height);

			for (var i = 0; i < tgtData.data.length; i += 4) {
				const input = tile.originalImage.data.slice(i, i + 4);
				const es = this.$OpenEO.Editor.Visualization.function(input, this.$OpenEO.Editor.Visualization.args);
				tgtData.data.set(es, i);
			}
			ctx.putImageData(tgtData, 0, 0);
		}
	}

}
</script>

<style scoped>
#mapCanvas {
	height: 100vh;
}
</style>