<script>
import Utils from '../../utils.js';
import EventBusMixin from '../EventBusMixin.vue';

import { isEmpty as extentIsEmpty } from 'ol/extent';
import { singleClick } from 'ol/events/condition';
import GeoJSON from 'ol/format/GeoJSON';
import Select from 'ol/interaction/Select';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Requires the MapMixin to be included, too.
export default {
	mixins: [
		EventBusMixin
	],
	methods: {
		addGeoJson(geojson, selectable = false, title = "GeoJSON", fill = true) {
			let source;
			if (geojson instanceof VectorSource) {
				source = geojson;
			}
			else {
				source = this.createGeoJsonSource(geojson, this.map.getView().getProjection());
			}

			let layer = new VectorLayer({title, source});
			if(!fill && this.removeLayerFill) {
				this.removeLayerFill(layer);
			}
			this.map.addLayer(layer);
			let extent = source.getExtent();
			if (!extentIsEmpty(extent)) {
				this.map.getView().fit(extent, this.getFitOptions());
			}

			if (selectable) {
				var select = new Select({
					hitTolerance: 5,
					multi: false,
					condition: singleClick,
					layers: [
						layer
					]
				});
				select.on('select', this.onSelect);
				this.map.addInteraction(select);
			}

			return layer;
		},
		onSelect(event) {
			if (event.selected.length > 0) {
				let feature = event.selected[0];
				let props = Utils.omitFromObject(feature.getProperties(), ['geometry']);
				let title = feature.getId() || "Feature Properties";
				this.emit('showDataModal', props, title);
			}
		},
		createGeoJsonSource(geojson, projection) {
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