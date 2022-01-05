<script>
import EventBusMixin from '../EventBusMixin.vue';

import 'ol/ol.css';
import { defaults as defaultControls, FullScreen, ScaleLine } from 'ol/control';
import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

import 'ol-ext/control/LayerSwitcher.css';
import LayerSwitcher from 'ol-ext/control/LayerSwitcher';

import Progress from './progress';

export default {
	mixins: [EventBusMixin],
	props: {
		id: {
			type: String,
			required: true
		},
		center: { // WGS84: lat, lon
			type: Array,
			default: () => [0,0]
		},
		zoom: {
			type: Number,
			default: 1
		},
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
			baseLayers: [],
			basemap: null,
			progress: null
		};
	},
	watch: {
		show() {
			this.showMap();
		}
	},
	mounted() {
		this.showMap();
	},
	methods: {
		showMap() {
			if (this.show) {
				this.$nextTick(() => this.renderMap());
			}
		},
		createMap(showLayerSwitcher = true, projection = 'EPSG:3857') {
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
			if (showLayerSwitcher) {
				customControls.push(new LayerSwitcher({trash: this.removableLayers}));
			}
			let basemapOptions = {
				opaque: true,
				attributionsCollapsible: false,
				wrapX: false
			};
			this.baseLayers = [];
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
					this.baseLayers.push(baselayer);
					hasDefault = true;
				}
			}
			let center = [this.center[1], this.center[0]];
			var mapOptions = {
				target: this.id,
				layers: this.baseLayers,
				view: new View({
					center: fromLonLat(center, projection),
					zoom: this.zoom,
					showFullExtent: true,
					projection
				})
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
		},

		onShow() {
			this.listen('windowResized', this.updateMapSize);
		},
		onHide() {
			this.unlisten('windowResized');
		},

		// To be overridden by implementing components.
		renderMap() {
			this.createMap();
		},

		async updateMapSize() {
			if (this.map) {
				await this.$nextTick();
				this.map.updateSize();
			}
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
		}

	}
}
</script>