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
			var sourceOpts = {};
			if (Utils.detectGeoJson(geojson)) {
				sourceOpts.features = (new GeoJSON()).readFeatures(
					geojson,
					{
						featureProjection: this.map.getView().getProjection()
					}
				);
			}
			var source = new VectorSource(sourceOpts);
			var layer = new VectorLayer({title, source});
			this.map.addLayer(layer);
			var extent = source.getExtent();
			if (!extentIsEmpty(extent)) {
				this.map.getView().fit(extent, this.getFitOptions());
			}
			return layer;
		}
	}
};
</script>