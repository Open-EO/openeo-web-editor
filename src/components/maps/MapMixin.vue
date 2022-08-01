<script>
import EventBusMixin from '../EventBusMixin.vue';
import Utils from '../../utils.js';

import 'ol/ol.css';
import { defaults as defaultControls, FullScreen, ScaleLine } from 'ol/control';
import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import Projection from 'ol/proj/Projection';
import ProjManager from './projManager';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

import 'ol-ext/control/LayerSwitcher.css';
import LayerSwitcher from 'ol-ext/control/LayerSwitcher';

import ProgressControl from './ProgressControl.vue';

let idCounter = 1;

export default {
	components: {
		ProgressControl
	},
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
			id: `map_` + idCounter++
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
			if (typeof opts === 'string') { // A projection code
				viewOpts.projection = await ProjManager.get(opts);
			}
			else if (opts instanceof Projection) {
				viewOpts.projection = opts;
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
			var customControls = [
				new FullScreen(),
				new ScaleLine()
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
			});
			layers.on('remove', evt => {
				let layer = evt.element;

				let events = layer.get('events');
				for(let event in events) {
					this.map.un(event, events[event]);
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
			if (this.$refs.progress) {
				source.on('tileloadstart', () => {
					this.$refs.progress.addLoading();
				});
				source.on('tileloadend', () => {
					this.$refs.progress.addLoaded();
				});
				source.on('tileloaderror', () => {
					this.$refs.progress.addLoaded();
				});
			}
			return source;
		},

		fromLonLat(coords) {
			return fromLonLat(coords, this.map.getView().getProjection());
		}
	}
}
</script>