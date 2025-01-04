<script>
import Utils from '../../utils.js';

import Collection from 'ol/Collection';
import LayerGroup from 'ol/layer/Group';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import WMTS, {optionsFromCapabilities} from 'ol/source/WMTS';

import 'ol-ext/control/Timeline.css';
import Timeline from 'ol-ext/control/Timeline';

import ExtentMixin from './ExtentMixin.vue';

export default {
	mixins: [ExtentMixin],
	data() {
		return {
			WMTSCapabilities: {},
			timeline: null,
		}
	},
	methods: {
		async addWebService(service) {
			switch(service.type.toLowerCase()) {
				case 'xyz':
					return this.updateXYZLayer(service);
				case 'wmts':
					return await this.updateWMTSLayer(service);
				default:
					Utils.error(this, 'Sorry, this web service type is not supported.');
					return null;
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

		async initWMTSLayer(service) {
			if (!this.WMTSCapabilities[service.url]) {
				try {
					let url = new URL(service.url);
					url.searchParams.set('service', 'wmts');
					url.searchParams.set('request', 'GetCapabilities');
					let response = await Utils.axios().get(url.toString(), { responseType: 'text' });
					var parser = new WMTSCapabilities();
					this.WMTSCapabilities[service.url] = parser.read(response.data);
				} catch (error) {
					Utils.exception(this, error, "WMTS Discovery failed");
				}
			}
			return this.WMTSCapabilities[service.url];
		},

		async updateWMTSLayer(service, prefix = "Service") {
			let attrs = service.attributes || {};

			let capabilities = await this.initWMTSLayer(service);
			if (!capabilities) {
				Utils.exception(this, error, "WMTS Discovery failed");
			}

			let minDate = null;
			let maxDate = null;
			let defaultDate = null;
			let source = null;
			let title = Utils.getResourceTitle(service, prefix);
			let layerCollection = new Collection();
			let layerNames;
			if (Array.isArray(attrs.layers)) {
				layerNames = attrs.layers;
			}
			else if (Array.isArray(capabilities.Contents.Layer)) {
				layerNames = layers.map(l => l.Identifier);
			}
			for(let layer of layerNames) {
				if (!layer) {
					continue;
				}
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
				if (Utils.isObject(attrs.dimensions)) {
					Object.assign(options.dimensions, service.attributes.dimensions);
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

			// Try to detect a bounding box and fit the view to it
			if (Utils.isObject(service.process) && Utils.isObject(service.process.process_graph)) {
				const crs84 = "urn:ogc:def:crs:OGC:1.3:CRS84";
				const e4326 = "EPSG:4326";
				Object.values(service.process.process_graph)
					.filter(node => node.process_id === 'load_collection' && Utils.isObject(node.arguments) && node.arguments.spatial_extent)
					.forEach(node => {
						let e = node.arguments.spatial_extent;
						let isBBox = (e.west || e.east || e.south || e.north) && (!e.crs || e.crs === 4326 || e.crs === e4326);
						let isGeoJSON = e.type && (!e.crs || (Utils.isObject(e.crs) && e.crs.type === "name" && (e.crs.properties?.name === e4326 || e.properties?.name === crs84)));
						if (isBBox || isGeoJSON) {
							this.addExtent(e, false);
							// ToDo: This should be combined into just a single call to addExtent to fit the view to the full extents
						}
					});
			}

			return group;
		}
	}
}
</script>