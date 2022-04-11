<template>
	<div :id="id" class="map-viewer">
		<div v-if="loading" class="map-loading">
			<i class="fas fa-spinner fa-spin"></i>
			<span>Loading map...</span>
		</div>
	</div>
</template>

<script>
import Utils from '../utils.js';
import GeoTiffMixin from './maps/GeoTiffMixin.vue';
import MapMixin from './maps/MapMixin.vue';
import ProjectionMixin from './maps/ProjectionMixin.vue';
import WebServiceMixin from './maps/WebServiceMixin.vue';

import Feature from 'ol/Feature';
import GeoTIFF from 'ol/source/GeoTIFF';
import { fromExtent as PolygonFromExtent } from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

export default {
	name: 'MapViewer',
	mixins: [GeoTiffMixin, MapMixin, ProjectionMixin, WebServiceMixin],
	props: {
		data: {}
	},
	data() {
		return {
			loading: true
		};
	},
	methods: {
		async renderMap() {
			try {
				let view;
				if (this.isGeoTiff) {
					// Create source and automatically derive view from it
					let geotiff = new GeoTIFF({ sources: [{
						url: this.data.blob instanceof Blob ? URL.createObjectURL(this.data.blob) : this.data.url
					}] });
					view = await geotiff.getView();
				}
				else if (this.webServiceType === 'wmts') {
					let capabilities = await this.initWMTSLayer(this.data);
					// ToDo: This assumes Web Mercator is always available, better check the capabilities...
					view = 'EPSG:3857';
				}

				this.createMap(view);
				this.addLayerSwitcher();
				this.addBasemaps();

				if (this.isWebService) {
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

<style src="./maps/MapMixin.css"></style>

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