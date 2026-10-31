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
		addExtent(data, fill = true) {
			let footprint = null;
			if (Utils.isObject(data)) {
				if (typeof data.west == 'number' && typeof data.east == 'number' && typeof data.south == 'number' && typeof data.north == 'number') {
					footprint = [data];
				}
				else if (data.type === 'Collection') {
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
				return this.addRectangles(footprint, fill);
			}
			else if (footprint) {
				return this.addGeoJson(footprint, false, "Footprint", fill);
			}
			return null;
		},

		addRectangles(rectangles, fill = true) {
			let mapProj = this.map.getView().getProjection();
			// Extents that cross the antimeridian continue beyond 180. All extents are moved into the world copy of
			// the first one (e.g. the overall extent of a STAC collection), so that they are shown and fitted together.
			let extents = rectangles.map(bbox => Utils.toMapExtent([bbox.west, bbox.south, bbox.east, bbox.north]));
			let center = extents.length > 0 ? (extents[0][0] + extents[0][2]) / 2 : 0;
			let features = extents.map(extent => {
				let polygon = PolygonFromExtent(Utils.alignExtent(extent, center)).transform("EPSG:4326", mapProj);
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
			if (!fill) {
				this.removeLayerFill(layer);
			}
			this.map.addLayer(layer);
			// ToDo: The Collection component has some smart fitting behavior in setMapSize()
			// Implement something similar here, too.
			// A global first extent contains all others, but those that cross the antimeridian would extend beyond it
			let isGlobal = extents.length > 0 && extents[0][2] - extents[0][0] >= 360;
			let fitExtent = isGlobal ? features[0].getGeometry().getExtent() : source.getExtent();
			this.map.getView().fit(fitExtent, this.getFitOptions());
			return layer;
		},

		removeLayerFill(layer) {
			let style = layer.getStyle();
			// https://github.com/openlayers/openlayers/issues/10131
			if (typeof style === 'function') {
				style = style()[0];
			}
			style.setFill(null);
		}

	}

}
</script>