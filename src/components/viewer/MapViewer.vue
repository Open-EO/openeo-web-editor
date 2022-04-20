<template>
	<div :id="id" class="map-viewer">
		<ProgressControl ref="progress" :map="map" />
		<TextControl v-if="textControlText" :text="textControlText" :tooltip="textControlTooltip" />
		<div v-if="loading" class="map-loading">
			<i class="fas fa-spinner fa-spin"></i>
			<span>Loading map...</span>
		</div>
	</div>
</template>

<script>
import Utils from '../../utils.js';
import GeoTIFF from '../../formats/geotiff';
import GeoJSON from '../../formats/geojson';

import GeoJsonMixin from '../maps/GeoJsonMixin.vue';
import GeoTiffMixin from '../maps/GeoTiffMixin.vue';
import MapMixin from '../maps/MapMixin.vue';
import WebServiceMixin from '../maps/WebServiceMixin.vue';

import { Service } from '@openeo/js-client';

import Feature from 'ol/Feature';
import { fromExtent as PolygonFromExtent } from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

export default {
	name: 'MapViewer',
	mixins: [GeoJsonMixin, GeoTiffMixin, MapMixin, WebServiceMixin],
	props: {
		data: {}
	},
	data() {
		return {
			loading: true
		};
	},
	computed: {
		...Utils.mapState(['connection']),
		isWebService() {
			return this.data instanceof Service && typeof this.data.type === 'string';
		},
		isGeoTiff() {
			return this.data instanceof GeoTIFF;
		},
		isGeoJson() {
			return this.data instanceof GeoJSON;
		}
	},
	methods: {
		async renderMap() {
			try {
				let view;
				if (this.isGeoJson) {
					// No preparation needed
				}
				else if (this.isGeoTiff) {
					await this.data.getData(this.connection);
					view = this.data.getView();
				}
				else if (this.isWebService && Utils.isMapServiceSupported(this.data.type)) {
					if (this.data.type.toLowerCase() === 'wmts') {
						let capabilities = await this.initWMTSLayer(this.data);
						// ToDo: This assumes Web Mercator is always available, better check the capabilities...
						view = 'EPSG:3857';
					}
				}
				else {
					throw new Error("Sorry, the given data can't be shown on a web map.");
				}

				await this.createMap(view);
				this.addLayerSwitcher();

				if (this.isGeoJson) {
					this.addBasemaps();
					this.addGeoJson(await this.data.getData(this.connection));
				}
				else if (this.isGeoTiff) {
					if (view.projection && ['EPSG:3857', 'EPSG:4326'].includes(view.projection.getCode())) {
						this.addBasemaps();
					}
					this.addGeoTiff(this.data);
				}
				else if (this.isWebService && Utils.isMapServiceSupported(this.data.type)) {
					this.addBasemaps();
					this.addWebService(this.data);
				}

				if (this.$listeners && this.$listeners.drop) {
					this.map.getViewport().addEventListener('dragover', event => event.preventDefault());
					this.map.getViewport().addEventListener('drop', this.$listeners.drop);
				}
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
		}
	}

}
</script>

<style src="../maps/MapMixin.css"></style>

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