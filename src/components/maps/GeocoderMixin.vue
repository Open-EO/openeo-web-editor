<script>
import Geocoder from '@kirtandesai/ol-geocoder';
import OSMGeocoder from './osmgeocoder';

export default {
	methods: {
		addGeocoder(callback, geojson = false) {
			if (!this.$config.geocoder) {
				return;
			}
			const options = {
				provider: new OSMGeocoder(this.$config.geocoder, geojson),
				placeholder: 'Search for ...',
				keepOpen: true,
				preventDefault: true
			};
			const geocoder = new Geocoder('nominatim', options);
			geocoder.on('addresschosen', event => {
				if (geojson) {
					callback(event.place?.original?.geojson, event);
				}
				else if (event.place.bbox) {
					let bbox = event.place.bbox.map(i => parseFloat(i));
					let bboxOpenEO = {
						west: bbox[2],
						east: bbox[3],
						north: bbox[1],
						south: bbox[0]
					}
					callback(bboxOpenEO, event);
				}
				else {
					callback(null, event);	
				}
			});
			this.map.addControl(geocoder);
		}
	}
}
</script>

<style src="@kirtandesai/ol-geocoder/dist/ol-geocoder.min.css"></style>

<style lang="scss">
.ol-geocoder.gcd-gl-container {
	z-index: 0;
	left: calc(0.5em - 1px) !important;
	top: calc(6.125em + 8px) !important;

	.ol-control {
		background-color: transparent;
	}
	
	ul.gcd-gl-result > li:nth-child(odd) {
		background-color: #f9f9f9;
	}
}
</style>