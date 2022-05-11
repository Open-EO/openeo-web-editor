<script>
import GeoJsonMixin from './GeoJsonMixin.vue';
import Utils from '../../utils.js';

import Feature from 'ol/Feature';
import { fromExtent as PolygonFromExtent } from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

export default {
	mixins: [GeoJsonMixin],
	methods: {
		// data can be:
		// bbox: Array of Array (west, south, east, north - WGS84) or STAC Collection
		// geometry: GeoJSON Object (WGS84) or STAC Item
		async addExtent(data) {
			let footprint = null;
			if (Utils.isObject(data)) {
				if (data.type === 'Collection') {
					footprint = data.extent.spatial.bbox.map(bbox => Utils.extentToBBox(bbox));
				}
				else if (data.type !== 'Feature' || data.geometry || data.bbox) {
					footprint = data;
				}
				else {
					footprint = null;
				}
			}
			else {
				footprint = data;
			}

			if (Array.isArray(footprint) && footprint.length > 0) {
				this.addRectangles(footprint);
			}
			else if (footprint) {
				this.addGeoJson(footprint, false, "Footprint");
			}
		},

		addRectangles(rectangles) {
			let mapProj = this.map.getView().getProjection();
			let features = rectangles.map(bbox => {
				let polygon = PolygonFromExtent([bbox.west, bbox.south, bbox.east, bbox.north]).transform("EPSG:4326", mapProj);
				return new Feature(polygon);
			});
			let source = new VectorSource({
				features,
				projection: mapProj,
				wrapX: false
			});
			let layer = new VectorLayer({
				title: "Bounding Boxes",
				displayInLayerSwitcher: false,
				source
			});
			this.map.addLayer(layer);
			this.map.getView().fit(source.getExtent(), this.getFitOptions());
			// ToDo: The Collection component has some smart fitting behavior in setMapSize()
			// Implement something similar here, too.
		}

	}

}
</script>