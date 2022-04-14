<script>
import Utils from '../../utils.js';

import { isEmpty as extentIsEmpty } from 'ol/extent';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Requires the MapMixin to be included, too.
export default {
	methods: {
		addGeoJson(geojson, title = "GeoJSON") {
			let source;
			if (geojson instanceof VectorSource) {
				source = geojson;
			}
			else {
				source = this.createGeoJsonSource(geojson, this.map.getView().getProjection());
			}

			let layer = new VectorLayer({title, source});
			this.map.addLayer(layer);
			let extent = source.getExtent();
			if (!extentIsEmpty(extent)) {
				this.map.getView().fit(extent, this.getFitOptions());
			}
			return layer;
		},
		createGeoJsonSource(geojson, projection = undefined) {
			let features = [];
			if (Utils.detectGeoJson(geojson)) {
				features = (new GeoJSON()).readFeatures(geojson, { featureProjection: projection })
			}
			return new VectorSource({
				features,
				wrapX: false
			});
		}
	}
};
</script>