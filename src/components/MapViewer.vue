<template>
	<div :id="id"></div>
</template>

<script>
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import Utils from '../utils.js';

import 'ol/ol.css';
import { defaults as defaultControls, FullScreen, ScaleLine } from 'ol/control';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import { Polygon, fromExtent as PolygonFromExtent } from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import Projection from 'ol/proj/Projection';
import {Fill, Stroke, Style} from 'ol/style';
import TileLayer from 'ol/layer/Tile';
import TileJSON from 'ol/source/TileJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';

import 'ol-ext/control/LayerSwitcher.css';
import LayerSwitcher from 'ol-ext/control/LayerSwitcher';
import 'ol-ext/control/Swipe.css';
import Swipe from 'ol-ext/control/Swipe';

import Progress from './openlayers/progress';
import AreaSelect from './openlayers/areaselect';

export default {
	name: 'MapViewer',
	mixins: [EventBusMixin],
	props: {
		id: {
			type: String,
			required: true
		},
		center: { // WGS84: lat, lon
			type: Array,
			default: () => [50.1725, 9.15]
		},
		zoom: {
			type: Number,
			default: 6
		},
		show: {
			type: Boolean,
			default: true
		},
		showExtent: { // WGS84: west, south, east, north
			type: Array,
			default: () => null
		},
		showAreaSelector: {
			// type: Boolean or Array with WGS84 coords: west, south, east, north
			default: false
		},
		readOnly: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			map: null,
			baseLayer: null,
			progress: null,
			userLayers: {},
			swipe: {
				control: null,
				left: null,
				right: null
			}
		}
	},
	watch: {
		show(newVal) {
			this.showMap();
		}
	},
	mounted() {
		this.showMap();
	},
	methods: {
		showMap() {
			if (this.show) {
				this.$nextTick(this.renderMap);
			}
		},
		renderMap() {
			if (this.map !== null) {
				this.map.render();
				return;
			}
			this.progress = new Progress();
			this.areaSelect = null;
			this.baseLayer = new TileLayer({
				source: this.trackTileProgress(new OSM()),
				baseLayer: true,
				title: "OpenStreetMap"
			});
			this.map = new Map({
				target: this.id,
				layers: [
					this.baseLayer
				],
				view: new View({
					center: fromLonLat([this.center[1], this.center[0]]),
					zoom: this.zoom
				}),
				controls: defaultControls().extend([
					new FullScreen(),
					new LayerSwitcher(),
					new ScaleLine(),
					this.progress.getControl()
				])
			});

			if (this.showExtent) {
				var bbox = Utils.extentToBBox(this.showExtent);
				this.addRectangle(bbox.west, bbox.east, bbox.north, bbox.south);
			}
			else if (this.showAreaSelector) {
				if (this.showAreaSelector === true) {
					this.addAreaSelector();
				}
				else {
					var bbox = Utils.extentToBBox(this.showAreaSelector);
					this.addAreaSelector(bbox.west, bbox.east, bbox.north, bbox.south);
				}
			}

			this.listen('windowResized', this.updateMapSize);
		},

		updateMapSize() {
			if (this.map) {
				this.map.updateSize()
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
				}),
				style: new Style({
					stroke: new Stroke({
						color: 'rgba(51, 136, 255)',
						width: 3
					}),
					fill: new Fill({
						color: 'rgba(51, 136, 255, 0.2)'
					})
				})
			}));
			this.map.getView().fit(extent);
		},

		addAreaSelector(w, e, n, s) {
			this.areaSelect = new AreaSelect(this.map);
			if (typeof w !== 'undefined') {
				this.areaSelect.setBounds();
			}
		},

		trackTileProgress(source) {
			source.on('tileloadstart', () => {
				this.progress.addLoading();
			});
			source.on('tileloadend', () => {
				this.progress.addLoaded();
			});
			source.on('tileloaderror', () => {
				this.progress.addLoaded();
			});
			return source;
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
			if (!this.layers[id]) {
				return;
			}
			this.layer[id].un('change');
			this.userLayers.removeLayer(this.layer[id]);
			delete this.layer[id];
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
			var id = service.serviceId;
			var url = service.url;
			var title = (service.title ? service.title.substr(0,50) : id.toUpperCase().substr(0,6)) + " (XYZ)";
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
				this.userLayers[id].setUrl(url);
			}
		}

	}

}
</script>

<style>
/* Customize layerswitcher control */
.ol-layerswitcher > button {
    font-size: 1.14em;
	background-color: rgba(0,60,136,.5);
}
.ol-layerswitcher > button:before, .ol-layerswitcher > button:after {
	background: transparent;
	background-image: none;
	box-shadow: none;
	position: inherit;
	transform: none;
    display: inline-block;
	width: auto;
	height: auto;
}
.ol-layerswitcher > button:after {
	font-family: "Font Awesome\ 5 Free";
	content: "\f5fd";
	font-weight: 900;
	left: 1px;
	top: 1px;
}
/* Customize scale line control */
.ol-scale-line {
	background-color: rgba(0,60,136,.5);
}
.ol-scale-line-inner {
	color: #fff;
	border-color: #fff;
}
/* Make sure the swipe control is behind the other controls */
.ol-unselectable, .ol-control {
	z-index: 1;
}
.ol-swipe {
	z-index: 0 !important;
}
/* Tole loading progress control */
.ol-progress-control {
	opacity: 1;
	transition: opacity 0.4s;
	bottom: calc(22px + 1em);
    left: 8px;
	position: absolute;
	background-color: rgba(0,60,136,.5);
	border-radius: 4px;
	padding: 2px;
	width: 150px;
	text-align: center;
}
.ol-progress-control .progress-label {
	font-size: 10px;
	color: #fff;
	margin-top: 2px;
}
.ol-progress-control .progress-bar {
	border-radius: 4px;
	border: 1px solid #fff;
	height: 10px;
}
.ol-progress-control .progress-bar-inner {
	background-color: #fff;
	height: 10px;
	width: 0;
}
/* Area selector */
.ol-areaselect {
	position: absolute;
    left: 0;
    top: 0;
}
.ol-areaselect-shade {
    position: absolute;
	background: rgba(0,0,0, 0.4);
	z-index: 0;
}
.ol-areaselect-handle {
    position: absolute;
    background: #fff;
    border: 1px solid #666;
    -moz-box-shadow: 1px 1px rgba(0,0,0, 0.2);
    -webkit-box-shadow: 1px 1px rgba(0,0,0, 0.2);
    box-shadow: 1px 1px rgba(0,0,0, 0.2);
    width: 14px;
    height: 14px;
	cursor: move;
	z-index: 1;
}
</style>