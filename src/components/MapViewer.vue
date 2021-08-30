<template>
	<div :id="id"></div>
</template>

<script>
import MapMixin from './MapMixin.vue';
import Utils from '../utils.js';

import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import LayerGroup from 'ol/layer/Group';
import { fromExtent as PolygonFromExtent } from 'ol/geom/Polygon';
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
			WMTSCapabilities: {},
			swipe: {
				control: null,
				left: null,
				right: null
			},
			timeline: null
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

			let layers = this.map.getLayers();
			layers.on('add', () => this.toggleSwipeControl());
			layers.on('remove', () => this.toggleSwipeControl());

			if (this.$listeners && this.$listeners.drop) {
				this.map.getViewport().addEventListener('dragover', event => event.preventDefault());
				this.map.getViewport().addEventListener('drop', this.$listeners.drop);
			}
		},

		addRectangle(w, e, n, s) {
			let extent = [...this.fromLonLat([w, s]), ...this.fromLonLat([e, n])];
			let layer = new VectorLayer({
				title: "Extent",
				displayInLayerSwitcher: false,
				source: new VectorSource({
					features: [
						new Feature(PolygonFromExtent(extent))
					],
					projection: "EPSG:4326",
					wrapX: false
				})
			});
			this.map.addLayer(layer);
			this.map.getView().fit(extent, this.fitOptions);
			// ToDo: The Collection component has some smart fitting behavior in setMapSize()
			// Implement something similar here, too.
		},

		async showWebService(service) {
			switch(service.type.toLowerCase()) {
				case 'xyz':
					this.updateXYZLayer(service);
					break;
				case 'wmts':
					await this.updateWMTSLayer(service);
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
					this.swipe.control.addLayer(shownLayers[0]);
					this.swipe.left = shownLayers[0];
				}
				if (this.swipe.right !== shownLayers[1]) {
					this.swipe.control.addLayer(shownLayers[1], true);
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

		addLayerToMap(layer) {
			layer.set('userLayer', true);

			this.map.addLayer(layer);

			layer.on('change', () => this.toggleSwipeControl());
			layer.on('change:visible', () => this.toggleSwipeControl());
			layer.on('change:zIndex', () => this.toggleSwipeControl());
		},

		removeLayerFromMap(id) {
			let layer = this.getLayerFromMap(id);
			if (layer) {
				this.map.removeLayer(layer);
			}
		},

		getLayerFromMap(id) {
			let layers = this.map.getLayers().getArray();
			for(let layer of layers) {
				if (layer.get('id') === id) {
					return layer;
				}
			}
			return null;
		},

		updateGeoTiffLayer(url, title = null) {
			var layer = new TileLayer({
				id: url,
				title: title ? title : 'GeoTiff',
				source: new TileJSON({
					url: 'http://tiles.rdnt.io/tiles?url=' + encodeURIComponent(url),
					crossOrigin: 'anonymous'
				})
			});
			this.addLayerToMap(layer);
			return layer;
			// ToDo: Implement full/native GTiff support
		},

		async addCollection(collection) {
			let link = Utils.getPreviewLinkFromSTAC(collection);
			if (!link) {
				Utils.error(this, 'No visualizations found for collection');
			}

			let service = {
				id: collection.id,
				url: link.href,
				title: collection.title || collection.id
			};

			// Remove other previewLayers, only show one at a time
			this.map.getLayers().forEach(layer => {
				if (layer.get('previewLayer') && layer.get('id') !== service.id) {
					this.map.removeLayer(layer);
				}
			});

			let layer;
			switch(link.rel.toLowerCase()) {
				case 'xyz':
					layer = this.updateXYZLayer(service);
					break;
				case 'wmts':
					let layers = [];
					if (link['wmts:layer']) {
						layers.push(link['wmts:layer']);
					}
					layer = await this.updateWMTSLayer(service, layers);
					break;
				default:
					Utils.error(this, 'Sorry, the service type is not supported by the map.');
					return;
			}

			layer.set('previewLayer', true);

			// Fit to extent of collection
			try {
				let bbox = Utils.extentToBBox(collection.extent.spatial.bbox[0]);
				let extent = [...this.fromLonLat([bbox.west, bbox.south]), ...this.fromLonLat([bbox.east, bbox.north])];
				let extentLayer = new VectorLayer({
					title: "Extent",
					noSwitcherDelete: true,
					source: new VectorSource({
						features: [
							new Feature(PolygonFromExtent(extent))
						],
						projection: "EPSG:4326",
						wrapX: false
					})
				});
			
				let style = extentLayer.getStyle();
				// https://github.com/openlayers/openlayers/issues/10131
				if (typeof style === 'function') {
					style = style()[0];
				}
				style.setFill(null);

				layer.getLayers().push(extentLayer);

				this.map.getView().fit(extent, this.fitOptions);
			} catch (error) {
				console.log(error);
			}
		},

		getWMTSTimes(capabilities, layerId) {
			const layers = capabilities.Contents.Layer || [];
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

		async updateWMTSLayer(service, layerNames = [], time = undefined, prefix = "Service") {
			this.removeLayerFromMap(service.id);

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
			let title = Utils.getResourceTitle(service, prefix);
			let layerCollection = new Collection();
			for(let layer of layerNames) {
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
					title,
					source: this.trackTileProgress(source),
					noSwitcherDelete: true
				});
				layerCollection.push(mapLayer);
			}

			if (minDate && maxDate) {
				this.timeline = new Timeline({
					className: 'ol-pointer',
					graduation: 'day',
					minDate: minDate,
					maxDate: maxDate
				});
				let run;
				this.timeline.on('scroll', function(e) {
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
							console.log(error);
						}
						run = null;
					}, 500);
				});
				this.map.addControl(this.timeline);

				this.timeline.addButton({
					className: 'timeline-date-label',
					title: `The date that is shown on the map for the collection '${title}'`,
					html: 'No date'
				});
				this.timeline.setDate(defaultDate);
			}

			let group = new LayerGroup({
				id: service.id,
				title,
				layers: layerCollection
			});
			this.addLayerToMap(group);

			if (this.timeline) {
				this.map.getLayers().on('remove', event => {
					if (event.element === group) {
						this.map.removeControl(this.timeline);
						this.timeline = null;
					}
				});
			}

			return group;
		},

		updateXYZLayer(service, prefix = "Service") {
			this.removeLayerFromMap(service.id);

			// Replace/add a query parameter with a unique ID so that OpenLayers doesn't load tiles from cache
			let url = Utils.replaceParam(service.url, '__editorSessionId', new Date().getTime()).replace(/%7B/g, '{').replace(/%7D/g, '}');
			let title = Utils.getResourceTitle(service, prefix);
			let layer = new TileLayer({
				title,
				source: this.trackTileProgress(new XYZ({
					url
				})),
				noSwitcherDelete: true
			});
			let group = new LayerGroup({
				id: service.id,
				title,
				layers: [
					layer
				]
			});
			this.addLayerToMap(group);
			return group;
		}

	}

}
</script>

<style src="./MapMixin.css"></style>