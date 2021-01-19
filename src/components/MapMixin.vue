<script>
import EventBusMixin from './EventBusMixin.vue';
import Utils from '../utils.js';

import 'ol/ol.css';
import { defaults as defaultControls, FullScreen, ScaleLine } from 'ol/control';
import { isEmpty as extentIsEmpty } from 'ol/extent';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import Map from 'ol/Map';
import View from 'ol/View';
import { Polygon, fromExtent as PolygonFromExtent } from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import Snap from 'ol/interaction/Snap';
import {Fill, Stroke, Style} from 'ol/style';
import TileLayer from 'ol/layer/Tile';
import TileJSON from 'ol/source/TileJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';

import 'ol-ext/control/LayerSwitcher.css';
import LayerSwitcher from 'ol-ext/control/LayerSwitcher';

import Progress from './openlayers/progress';

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
		}
	},
	data() {
		return {
			map: null,
			baseLayer: null,
			osm: null,
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
				this.$nextTick(this.renderMap);
			}
		},
		createMap(showLayerSwitcher = false) {
			if (this.map !== null) {
				this.map.updateSize();
				this.map.render();
				return;
			}
			this.progress = new Progress();
			this.osm = new OSM();
			this.baseLayer = new TileLayer({
				source: this.trackTileProgress(this.osm),
				baseLayer: true,
				title: "OpenStreetMap"
			});
			var customControls = [
				new FullScreen(),
				new ScaleLine(),
				this.progress.getControl()
			];
			if (showLayerSwitcher) {
				customControls.push(new LayerSwitcher());
			}
			var mapOptions = {
				target: this.id,
				layers: [
					this.baseLayer
				],
				view: new View({
					center: fromLonLat([this.center[1], this.center[0]]),
					zoom: this.zoom
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

		// To be overridden by implementing components.
		renderMap() {
			this.createMap();
		},

		updateMapSize() {
			if (this.map) {
				this.map.updateSize();
			}
		},

		addGeoJson(geojson) {
			var sourceOpts = {};
			if (Utils.detectGeoJson(geojson)) {
				sourceOpts.features = (new GeoJSON()).readFeatures(
					geojson,
					{
						featureProjection: this.osm.getProjection()
					}
				);
			}
			var source = new VectorSource(sourceOpts);
			var layer = new VectorLayer({
				title: "GeoJSON",
				source: source
			});
			this.map.addLayer(layer);
			var extent = source.getExtent();
			if (!extentIsEmpty(extent)) {
				this.map.getView().fit(extent);
			}
			return layer;
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