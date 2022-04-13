<script>
import EventBusMixin from '../EventBusMixin.vue';
import Utils from '../../utils.js';

import proj4 from 'proj4';
import 'ol/ol.css';
import { defaults as defaultControls, FullScreen, ScaleLine } from 'ol/control';
import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat, get as getProjection } from 'ol/proj';
import Projection from 'ol/proj/Projection';
import { register } from 'ol/proj/proj4';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

import 'ol-ext/control/LayerSwitcher.css';
import LayerSwitcher from 'ol-ext/control/LayerSwitcher';

import Progress from './progress';

let idCounter = 1;

export default {
	mixins: [EventBusMixin],
	props: {
		show: {
			type: Boolean,
			default: true
		},
		editable: {
			type: Boolean,
			default: true
		},
		removableLayers: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			map: null,
			id: `map_` + idCounter++,
			progress: null
		};
	},
	watch: {
		async show() {
			await this.showMap();
		}
	},
	computed: {
		...Utils.mapState(['userLocation', 'locationZoom']),
	},
	async mounted() {
		await this.showMap();
	},
	methods: {
		async showMap() {
			if (this.show) {
				await this.$nextTick();
				await this.renderMap();
			}
		},
		async createMap(opts = 'EPSG:3857') {
			let view;
			let viewOpts = {
				showFullExtent: true
			};
			if (typeof opts === 'string') { // A projection
				let projection = await this.loadProjection(opts);
				if (projection) {
					viewOpts.projection = projection;
				}
			}
			else if (opts instanceof View) {
				view = opts;
			}
			else if (Utils.isObject(opts)) {
				viewOpts = opts;
			}

			if (!view) {
				view = new View(viewOpts);
				if (!view.getCenter()) {
					view.setCenter(fromLonLat([this.userLocation[1], this.userLocation[0]], view.getProjection()));
				}
				if (!view.getZoom()) {
					view.setZoom(this.locationZoom);
				}
			}

			if (this.map !== null) {
				this.map.updateSize();
				this.map.render();
				return;
			}
			this.progress = new Progress();
			var customControls = [
				new FullScreen(),
				new ScaleLine(),
				this.progress.getControl()
			];
			var mapOptions = {
				target: this.id,
				view
			};
			if (!this.editable) {
				mapOptions.interactions = [];
				mapOptions.controls = customControls;
			}
			else {
				mapOptions.controls = defaultControls().extend(customControls);
			}
			this.map = new Map(mapOptions);

			this.listen('windowResized', this.updateMapSize);
			
			let layers = this.map.getLayers();
			layers.on('add', evt => {
				let layer = evt.element;

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
		},

		addLayerSwitcher() {
			this.map.addControl(new LayerSwitcher({trash: this.removableLayers}));
		},

		addBasemaps() {
			let basemapOptions = {
				opaque: true,
				attributionsCollapsible: false,
				wrapX: false
			};
			let baselayers = [];
			if (Array.isArray(this.$config.basemaps)) {
				let hasDefault = false;
				for(let opts of this.$config.basemaps) {
					let basemap = new XYZ(Object.assign({}, basemapOptions, opts));
					let baselayer = new TileLayer({
						source: this.trackTileProgress(basemap),
						baseLayer: true,
						title: opts.title,
						noSwitcherDelete: true,
						visible: !hasDefault
					});
					baselayers.push(baselayer);
					this.map.addLayer(baselayer);
					hasDefault = true;
				}
			}
			return baselayers;
		},

		onShow() {
			this.listen('windowResized', this.updateMapSize);
		},
		onHide() {
			this.unlisten('windowResized');
		},

		// To be overridden by implementing components.
		async renderMap() {
			await this.createMap();
			this.addBasemaps();
		},

		async updateMapSize() {
			if (this.map) {
				await this.$nextTick();
				this.map.updateSize();
			}
		},

		addLayerToMap(layer) {
			layer.set('userLayer', true);
			this.map.addLayer(layer);
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
		getVisibleLayers() {
			let shownLayers = [];
			let layers = this.map.getLayers().getArray();
			for(let layer of layers) {
				if (layer.get('userLayer') && layer.getVisible()) {
					shownLayers.push(layer);
				}
			}
			return shownLayers;
		},

		getFitOptions(paddingPc = 25) {
			let fitOptions = {};
			// Make a bigger extent visible so that user can get a better overview
			var size = this.map.getSize();
			if (size && paddingPc > 0) {
				fitOptions.padding = [size[0]*paddingPc/100, size[1]*paddingPc/100, size[0]*paddingPc/100, size[1]*paddingPc/100];
			}
			else {
				fitOptions.padding = [30,30,30,30];
			}
			return fitOptions;
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

		async loadProjection(crs) {
			if (crs instanceof Projection) {
				return crs;
			}
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
			let proj = await import('../../assets/epsg-proj.json');
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
		fromLonLat(coords) {
			return fromLonLat(coords, this.map.getView().getProjection());
		}
	}
}
</script>