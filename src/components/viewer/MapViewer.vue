<template>
	<Splitpanes horizontal class="default-theme">
		<Pane id="map">
			<div :id="id" class="map-viewer">
				<ProgressControl ref="progress" :map="map" />
				<UserLocationControl :map="map" />
				<AddDataControl :map="map" @add="addData" />
				<template v-if="isGeoTiff">
					<TextControl :text="textControlText" />
					<div class="ol-unselectable ol-control geotiff-channels">
						<template v-for="state in geotiffs">
							<ChannelControl
								v-if="!state.colorMap" :key="state.layer.id"
								:bands="state.bands" :defaultChannels="state.defaultChannels"
								:title="geotiffs.length > 1 ? state.layer.get('title') : ''"
								@update="(type, data) => updateGeoTiffStyle(state, type, data)"
							/>
						</template>
					</div>
				</template>
				<div v-if="loading" class="map-loading">
					<i class="fas fa-spinner fa-spin"></i>
					<span>Loading map...</span>
				</div>
			</div>
		</Pane>
		<Pane v-if="chart" id="chart" :size="33">
			<span class="close" @click="closeChart"><i class="fa fa-times" aria-hidden="true"></i></span>
			<ScatterChart v-bind="chart" :height="220" />
		</Pane>
	</Splitpanes>
</template>

<script>
import Utils from '../../utils.js';
import { default as GeoTiffFile } from '../../formats/geotiff';
import JSON_ from '../../formats/json';

import { Splitpanes, Pane } from 'splitpanes';

import ScatterChart from './ScatterChart.vue';
import AddDataControl from '../maps/AddDataControl.vue';
import ChannelControl from '../maps/ChannelControl.vue';
import ExtentMixin from '../maps/ExtentMixin.vue';
import GeocoderMixin from '../maps/GeocoderMixin.vue';
import MapMixin from '../maps/MapMixin.vue';
import TextControl from '../maps/TextControl.vue';
import WebServiceMixin from '../maps/WebServiceMixin.vue';
import GeoTiffState from '../maps/geotiff/state';
import '../maps/geotiff/fix';

import { Service } from '@openeo/js-client';

import Feature from 'ol/Feature';
import { fromExtent as PolygonFromExtent } from 'ol/geom/Polygon';
import { transformExtent } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import TileLayer from 'ol/layer/WebGLTile';
import { default as OlGeoTiff } from 'ol/source/GeoTIFF';
import VectorSource from 'ol/source/Vector';

import 'ol-ext/control/Swipe.css';
import Swipe from '../maps/Swipe.js';

export default {
	name: 'MapViewer',
	mixins: [
		ExtentMixin,
		GeocoderMixin,
		MapMixin,
		WebServiceMixin
	],
	components: {
		AddDataControl,
		ChannelControl,
		Pane,
		ScatterChart,
		Splitpanes,
		TextControl
	},
	props: {
		data: {}
	},
	data() {
		return {
			textControlText: 'Value: -',
			loading: true,
			chart: null,
			geotiffs: [],
			swipe: null,
			layerId: 0
		};
	},
	computed: {
		...Utils.mapState(['connection']),
		...Utils.mapState('editor', ['appMode']),
		isWebService() {
			return this.data instanceof Service && typeof this.data.type === 'string';
		},
		isGeoTiff() {
			return this.data instanceof GeoTiffFile;
		},
		isGeoJson() {
			return this.data instanceof JSON_ && this.data.isGeoJson;
		}
	},
	mounted() {
		this.$emit('mounted', this);
	},
	methods: {
		async renderMap() {
			try {
				let view;
				let data;
				if (this.isGeoJson) {
					data = await this.data.loadData(this.connection);
				}
				else if (this.isGeoTiff) {
					data = await this.data.loadData(this.connection);
					let projection = data.getProjection();
					if (projection) {
						view = projection;
					}
				}
				else if (this.isWebService && Utils.isMapServiceSupported(this.data.type)) {
					if (this.data.type.toLowerCase() === 'wmts') {
						let capabilities = await this.initWMTSLayer(this.data);
						// ToDo: Right now we assume Web Mercator is always available, better check the capabilities...
					}
				}
				else {
					throw new Error("Sorry, the given data can't be shown on a web map.");
				}

				await this.createMap(view);

				const layers = this.map.getLayers();
				layers.on('add', evt => {
					const state = evt.element.get('geotiff');
					if (state) {
						this.geotiffs.push(state);
						this.updateSwiper();
					}
				});
				layers.on('remove', evt => {
					const state = evt.element.get('geotiff');
					const index = this.geotiffs.indexOf(state);
					if (index > -1) {
						this.geotiffs.splice(index, 1);
						this.updateSwiper();
					}
				});

				this.addLayerSwitcher();
				this.addGeocoder(data => {
					if (!data) {
						return;
					}
					let extent = this.toExtent(data);
					extent = transformExtent(extent, 'EPSG:4326', this.map.getView().getProjection());
					this.map.getView().fit(extent, this.getFitOptions());
				});

				if (this.isGeoJson) {
					this.addBasemaps();
					this.addGeoJson(data, true);
				}
				else if (this.isGeoTiff) {
					let proj = this.map.getView().getProjection();
					if (proj.basemap || ['EPSG:3857', 'EPSG:4326'].includes(proj.getCode())) {
						this.addBasemaps();
					}
					this.addGeoTiff(data, data.title);
					let stac = this.data.getContext();
					if (stac) {
						this.addExtent(stac, false);
					}
				}
				else if (this.isWebService && Utils.isMapServiceSupported(this.data.type)) {
					this.addBasemaps();
					this.addWebService(this.data);
				}

				if (this.$listeners && this.$listeners.drop) {
					this.map.getViewport().addEventListener('dragover', event => event.preventDefault());
					this.map.getViewport().addEventListener('drop', this.$listeners.drop);
				}

				this.map.on('pointermove', this.onPointerMove);
				this.map.on('click', this.onClick);
			} catch (error) {
				Utils.exception(this, error);
			}

			this.loading = false;
		},

		async addCollection() {
			let layer = this.showWebService(this.data);
			// Fit to extent of collection
			try {
				let bbox = service.attributes.bbox;
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
			
				this.removeLayerFill(extentLayer);
				layer.getLayers().push(extentLayer);

				this.map.getView().fit(extent, this.getFitOptions(10));
			} catch (error) {
				console.log(error);
			}
		},

		getPixelValues(pixel) {
			return this.geotiffs.map(state => {
				const layer = state.layer;
				// Get data into an array
				let data = layer.getData(pixel);
				data = data ? Array.from(data) : [];
				
				// Handle transparency / no-data
				const noData = state.noData;
				const alpha = noData.length > 0 ? data.pop() : undefined;
				data = data.map(x => ((alpha === 0 || noData.includes(x)) ? NaN : x));

				// Get labels
				const labels = data.map((_, i) => {
					const band = state.bands[i];
					if (band) {
						const name = String(band.name || band.id);
						if (name.length > 0) {
							return name;
						}
					}
					return String(i);
				});

				// Collection information and add to array
				return {
					title: layer.get('title'),
					data,
					labels
				};
			});
		},
		formatCoords(coords) {
			return coords.map(x => String(parseFloat(x.toFixed(6)))).join(', ');
		},
		formatValue({data}) {
			if (!Array.isArray(data) || data.length === 0) {
				return '-';
			}
			return data
				.map(x => {
					x = parseFloat(x.toFixed(6));
					if (isNaN(x)) {
						return 'no data';
					}
					return x;
				})
				.join(' / ');
		},
		onPointerMove(evt) {
			const values = this.getPixelValues(evt.pixel);
			let text = '-';
			if (values.length === 1) {
				text = this.formatValue(values[0]);
			}
			else if (values.length > 1) {
				text = values.map(x => `\r\n- ${x.title}: ${this.formatValue(x)}`).join('');
			}
			const plural = values.length > 1 ? 's' : '';
			const coords = this.formatCoords(evt.coordinate);
			this.textControlText = [
				`Value${plural}: ${text}`,
				`Pixel Value${plural}: ${text}\r\nCoordinate: ${coords}`
			];
		},
		onClick(evt) {
			const data = this.getPixelValues(evt.pixel);

			const validValues = data
				.map(x => x.data)
				.flat()
				.filter(x => isFinite(x));
			
			if (validValues.length < 2) {
				this.chart = null;
				return;
			}

			let labels = data.map(x => x.labels).flat();
			labels = Array.from(new Set(labels));

			const datasets = data.map(x => {
				const map = {};
				for (let i in x.data) {
					map[x.labels[i]] = x.data[i];
				}
				return {
					label: x.title,
					data: map
				};
			});

			const coords = this.formatCoords(evt.coordinate);
			this.chart = {
				title: `Coordinate: ${coords}`,
				labels,
				datasets
			};
		},
		closeChart() {
			this.chart = null;
		},

		async addGeoTiff(geotiff, title = "GeoTiff") {
			const tiffState = new GeoTiffState(geotiff);
			const sourceOpts = {
				nodata: tiffState.noData[0] // OL only supports passing one no data value
			};
			if (geotiff.getBlob()) {
				sourceOpts.blob = geotiff.getBlob();
			}
			else {
				sourceOpts.url = geotiff.getUrl();
			}

			const source = new OlGeoTiff({
				interpolate: false,
				normalize: false,
				convertToRGB: geotiff.convertToRGB,
				sources: [sourceOpts]
			});

			const layer = new TileLayer({
				id: geotiff.getUrl(),
				title,
				source: source,
				className: `geotiff${this.layerId++}`, // https://github.com/Viglino/ol-ext/issues/1047 (for Swipe)
				cacheSize: 2048 // https://github.com/openlayers/openlayers/issues/13670
			});
			tiffState.layer = layer;
			layer.set('geotiff', tiffState);
			layer.once('prerender', () => tiffState.setStyle());
			layer.on('change:visible', () => this.updateSwiper());
			this.addLayerToMap(layer);

			let extent = geotiff.getExtent();
			if (extent) {
				this.map.getView().fit(extent, this.getFitOptions(10));
			}

			return layer;
		},

		async addData(files) {
			if (files.length > 5 && !Utils.confirmOpenAll(files)) {
				return;
			}
	
			const promises = files.map(async (file) => {
				await file.loadData(this.connection);
				if (file instanceof GeoTiffFile) {
					return await this.addGeoTiff(file, file.title);
				}
				else if (file instanceof JSON_ && file.isGeoJson) {
					return await this.addGeoJson(file, false, file.title);
				}
				else {
					Utils.error(this, new Error(`Sorry, the given data at ${file.href} is not supported.`));
				}
			});
			await Promise.all(promises);
		},

		updateSwiper() {
			const layers = this.map.getLayers().getArray()
				.filter(layer => layer.get('geotiff') && layer.getVisible());
			if (layers.length === 2) {
				if (this.swipe && layers.every((l, i) => l === this.swipe.layers[i])) {
					return;
				}
				const opts = {
					layers: layers[0],
					rightLayers: layers[1]
				};
				const control = new Swipe(opts);
				this.swipe = { control, layers };
				this.map.addControl(control);
			}
			else if (layers.length !== 2 && this.swipe) {
				this.map.removeControl(this.swipe.control);
				this.swipe = null;
			}
		},

		updateGeoTiffStyle(state, type, data) {
			switch(type) {
				case 'channels':
					state.channels = data;
					this.setOptions('channels', data);
					break;
			}
			state.setStyle();
		}
		
	}

}
</script>

<style src="../maps/MapMixin.scss" lang="scss"></style>

<style lang="scss">
.map-viewer {
	position: relative;

	.map-loading {
		position: absolute;
		top: 0;
		left: 0;
		background-color: rgba(0,0,0,0.6);
		width: 100%;
		height: 100%;
		z-index: 9999;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;

		> i {
			font-size: 2em;
		}
	}
}

.ol-control.geotiff-channels {
	bottom: calc(22px + 1em);
  right: 8px;
	position: absolute;
	max-height: 150px;
	overflow-y: auto;
}

#chart {
	position: relative;

	.close {
		position: absolute;
		top: 0;
		right: 0.5em;
		padding: 0.5em;
		cursor: pointer;
		color: black;

		&:hover {
			color: red;
		}
	}
}
</style>