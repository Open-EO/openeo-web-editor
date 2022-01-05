<template>
	<div :id="id"></div>
</template>

<script>
import MapMixin from './maps/MapMixin.vue';
import Utils from '../utils.js';
import TextControl from './maps/textControl';

import proj4 from 'proj4';

import Collection from 'ol/Collection';
import { applyTransform } from 'ol/extent';
import Feature from 'ol/Feature';
import LayerGroup from 'ol/layer/Group';
import { fromExtent as PolygonFromExtent } from 'ol/geom/Polygon';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat, get as getProjection, getTransform } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import GeoTIFF from 'ol/source/GeoTIFF';
import WebGLTileLayer from 'ol/layer/WebGLTile';
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
			this.createMap(true);

			let layers = this.map.getLayers();
			layers.on('add', evt => {
				let layer = evt.element;

				this.toggleSwipeControl();

				let events = layer.get('events');
				for(let event in events) {
					this.map.on(event, events[event]);
				}

				let controls = layer.get('controls');
				if (Array.isArray(controls)) {
					for(let control of controls) {
						this.map.addControl(control);
					}
				}
			});
			layers.on('remove', evt => {
				let layer = evt.element;

				this.toggleSwipeControl();

				let events = layer.get('events');
				for(let event in events) {
					this.map.un(event, events[event]);
				}

				let controls = layer.get('controls');
				if (Array.isArray(controls)) {
					for(let control of controls) {
						this.map.removeControl(control);
					}
				}
			});

			if (this.$listeners && this.$listeners.drop) {
				this.map.getViewport().addEventListener('dragover', event => event.preventDefault());
				this.map.getViewport().addEventListener('drop', this.$listeners.drop);
			}
		},

		toggleSwipeControl() {
			// Swipe Control errors for WebGLTileLayer: https://github.com/Viglino/ol-ext/issues/723
			var shownLayers = this.getVisibleLayers().filter(layer => !(layer instanceof WebGLTileLayer));
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

		fromLonLat(coords) {
			return fromLonLat(coords, this.map.getView().getProjection());
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
					Utils.error(this, 'Sorry, this web service type is not supported.');
			}
		},

		async updateGeoTiffLayer(data, title = "GeoTiff", context = null) {
			// ToDos:
			// - Handle CRS (e.g. UTM)
			// - Pass in overviews
			// - Handle multiple bands
			let min, max, nodata;
			const NAN = Number.NAN; // ToDo: Check whether Number.NAN works with OL

			// Try to get metadata from first band
			if (Array.isArray(data['raster:bands']) && data['raster:bands'].length === 1 && Utils.isObject(data['raster:bands'][0])) {
				let band = data['raster:bands'][0];
				nodata = typeof nodata === "string" && nodata.toLowerCase() === "nan" ? NAN : band.nodata;
				if (Utils.isObject(band.statistics)) {
					min = band.statistics.minimum;
					max = band.statistics.maximum;
				}
				else if (typeof band.data_type === 'string') {
					if (band.data_type.startsWith('uint')) {
						min = 0;
					}
					if (band.data_type === 'uint8') {
						max = 255;
					}
					else if (band.data_type === 'int8') {
						max = 127;
					}
					// else: let openlayers choose
				}
			}

			// Set options for GeoTIFF source
			let options = { min, max, nodata };
			if(data.blob instanceof Blob) {
				options.url = URL.createObjectURL(data.blob);
			}
			else {
				options.url = data.url;
			}

			// Create source and automatically derive view from it
			let source = new GeoTIFF({ sources: [options] });
			let view = await source.getView();

			// Load projection from GeoTiff / database
			let projection = await this.loadProjection(view.projection.getCode());
			// Get projection details from STAC Item (todo: add collection support)
			if (!projection && context && Utils.isObject(context.properties)) {
				if (context.properties['proj:epsg']) {
					projection = this.loadProjection(context.properties['proj:epsg']);
				}
				else if (context.properties['proj:wkt2']) {
					projection = this.addProjection(context.id, context.properties['proj:wkt2']);
				}
			}
			if (projection) {
				view.projection = projection;
			}
			else {
				throw new Error("The projection is not supported.");
			}

			let layer = new WebGLTileLayer({
				id: options.url,
				title,
				source
			});

			let fromLonLat = getTransform(view.projection, this.map.getView().getProjection());
			let extent = applyTransform(view.extent, fromLonLat);
			this.map.getView().fit(extent, this.getFitOptions(10));

			this.addLayerToMap(layer);

			return layer;
		},

		async loadProjection(crs) {
			let code, id;
			if (typeof crs === 'string' && crs.match(/^EPSG:\d+$/i)) {
				code = crs.toUpperCase();
				id = crs.substr(5);
			}
			else if (Number.isInteger(crs)) {
				code = `EPSG:${crs}`
				id = String(crs);
			}
			else {
				return null;
			}

			// Get projection from cache
			let projection = getProjection(code);
			if (projection) {
				return projection;
			}

			// Get projection from database
			let proj = await import('../assets/epsg-proj.json');
			if (id in proj) {
				return this.addProjection(code, proj[id]);
			}

			// No projection found
			return null;
		},

		addProjection(code, meta) {
			try {
				proj4.defs(code, meta);
				register(proj4);
				return getProjection(code);
			} catch (error) {
				console.error(error);
				return null;
			}
		},

		addTextControl(layer) {
			let textControl = new TextControl();
			layer.set('events', {
				singleclick: evt => {
				const pixel = this.map.getEventPixel(evt.originalEvent);
					this.map.forEachLayerAtPixel(pixel, (layer, data) => {
						console.log(data);
						let value = Utils.displayRGBA(data, min, max, nodata, 5);
						textControl.setValue(`Estimated Pixel Value: ${value}`);
						textControl.setTitle(`Coordinate: ${evt.coordinate.join(', ')}`);
					});
				}
			});
			// ToDo: This is shown twice if multiple GeoTiffs are shown
			layer.set('controls', [textControl]);
		},

		getOptionsFromUser(min, max, nodata) {
			if (typeof min !== 'number') {
				min = Number.parseFloat(prompt("Please input the minimum value", min));
			}
			if (typeof max !== 'number') {
				max = Number.parseFloat(prompt("Please input the maximum value", max));
			}
			nodata = prompt("Please input the no-data value (NaN is allowed, too)", nodata);
			if (typeof nodata !== 'string' || nodata.trim().length === 0) {
				nodata = undefined;
			}
			else if (nodata.toLowerCase() === "nan") {
				nodata = Number.NaN;
			}
			else {
				nodata = Number.parseFloat(nodata);
			}
			return { min, max, nodata }
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

				this.map.getView().fit(extent, this.getFitOptions(10));
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
			group.on('change:visible',  () => {
				if (this.timeline && this.timeline.element) {
					// Remove time selector on Map if not required any more https://github.com/Open-EO/openeo-web-editor/issues/207
					this.timeline.element.style.display = group.getVisible() ? 'block' : 'none';
				}
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

<style src="./maps/MapMixin.css"></style>

<style>
.ol-control.value {
	top: 0.5em;
	left: 3em;
}
.ol-control.ol-timeline .timeline-date-label {
	width: 7em;
    font-size: 0.8em;
    font-weight: normal;
}
</style>