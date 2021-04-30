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
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import WMTS, {optionsFromCapabilities} from 'ol/source/WMTS';

import 'ol-ext/control/Swipe.css';
import Swipe from 'ol-ext/control/Swipe';

import 'ol-ext/control/Timeline.css';
import Timeline from 'ol-ext/control/Timeline';

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
			WMTSCapabilities: {},
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
				case 'wmts':
					this.updateWMTSLayer(service);
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

		addCollection(collection) {
			this.addWMTSLayerFromCollection(collection);
			// ToDo: Add XYZ support
		},

		addWMTSLayerFromCollection(collection) {
			let wmtsLink = collection.links.find(link => link.rel === 'wmts');
			if (!wmtsLink) {
				Utils.error(this, 'No visualizations found for collection');
			}
			let layers = [];
			if (wmtsLink['wmts:layer']) {
				layers.push(wmtsLink['wmts:layer']);
			}
			this.updateWMTSLayer({
				id: collection.id,
				url: wmtsLink.href,
				title: collection.title || collection.id
			}, layers);
		},

		getWMTSTimes(capabilities, layerId) {
			const layers = capabilities['Contents']['Layer'];
			let layer = layers.find(l => l.Identifier == layerId);
			if (!layer || !layer.Dimension) {
				return [];
			}
			let timeDimension = layer.Dimension.find(d => d.Identifier === 'TIME');
			if (!timeDimension) {
				return [];
			}
			return timeDimension.Value.sort();
		},

		async updateWMTSLayer(service, layers = [], time = undefined, prefix = "Service") {
			if (typeof this.userLayers[service.id] === 'undefined') {
				if (!this.WMTSCapabilities[service.url]) {
					let url = new URL(service.url);
					url.searchParams.set('service', 'wmts');
					url.searchParams.set('request', 'GetCapabilities');
					let response = await axios.get(url.toString(), { responseType: 'text' });
					var parser = new WMTSCapabilities();
					this.WMTSCapabilities[service.url] = parser.read(response.data);
				}

				let capabilities = this.WMTSCapabilities[service.url];
				let minDate = null;
				let maxDate = null;
				let defaultDate = null;
				let source = null;
				for(let layer of layers) {
					let options = optionsFromCapabilities(capabilities, {
						layer,
						matrixSet: 'EPSG:3857'
					});
					if (!defaultDate) {
						defaultDate = new Date(options.dimensions.TIME);
					}

					let times = this.getWMTSTimes(capabilities, layer);
					if (times.length) {
						let min = new Date(times[0]);
						let max = new Date(times[times.length -1]);
						if (!minDate || min < minDate) {
							minDate = min;
						}
						if (!maxDate || max > maxDate) {
							maxDate = max;
						}
					}
					if (time) {
						if (!Utils.isObject(options.dimensions)) {
							options.dimensions = {};
						}
						options.dimensions.time = time;
					}
					source = new WMTS(options);
					var mapLayer = new TileLayer({
						source: this.trackTileProgress(source),
						title: Utils.getResourceTitle(service, prefix)
					});
					this.addLayerToMap(service.id + layer, mapLayer);
				}

				if (minDate && maxDate) {
					var tline = new Timeline({
						className: 'ol-pointer',
						graduation: 'day',
						minDate: minDate,
						maxDate: maxDate
					});
					let run;
					tline.on('scroll', function(e) {
						if (!e.date || e.date > maxDate || e.date < minDate) {
							return;
						}
						if (run) {
							window.clearTimeout(run);
						}
						run = window.setTimeout(() => {
							try {
								let date = e.date.toISOString().substr(0, 10);
								source.updateDimensions({
									TIME: date
								});
								let btns = document.getElementsByClassName('timeline-date-label');
								btns[0].innerText = date;
								btns[0].disabled = true;
							} catch (error) {
								console.log(error.message);
							}
							run = null;
						}, 500);
					});
					this.map.addControl(tline);
					tline.addButton ({
						className: 'timeline-date-label',
						title: 'Date shown',
						html: 'No date'
					});
					tline.setDate(defaultDate); 
				}
			}
			else {
				for(let layer of layers) {
					this.userLayers[service.id + layer].getSource().updateDimensions({
						TIME: time
					});
				}
			}
		},

		updateXYZLayer(service, prefix = "Service") {
			var id = service.id;
			if (typeof this.userLayers[id] === 'undefined') {
				var layer = new TileLayer({
					source: this.trackTileProgress(new XYZ({
						url: service.url
					})),
					title: Utils.getResourceTitle(service, prefix)
				});
				this.addLayerToMap(id, layer);
			}
			else {
				// Replace/add a query parameter with a unique ID so that OpenLayers doesn't load tiles from cache
				var newUrl = Utils.replaceParam(service.url, '__editorSessionId', new Date().getTime());
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