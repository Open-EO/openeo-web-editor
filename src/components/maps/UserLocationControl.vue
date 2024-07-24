<template>
	<div class="ol-location ol-unselectable ol-control" style="pointer-events: auto;">
		<button type="button" @click.prevent.stop="request" title="Go to your location">
			<i class="fas fa-location-arrow"></i>
		</button>
	</div>
</template>

<script>
import ControlMixin from './ControlMixin';
import { fromLonLat } from 'ol/proj';

export default {
	name: 'UserLocationControl',
	mixins: [
		ControlMixin
	],
	methods: {
		request() {
			if ("geolocation" in navigator) {
				navigator.geolocation.getCurrentPosition(
					position => {
						let view = this.map.getView();
						let coords = [position.coords.longitude, position.coords.latitude];
						view.setCenter(fromLonLat(coords, view.getProjection()));
					},
					error => Utils.error(this, error, "Location Error"),
					{
						maximumAge: Infinity
					}
				);
			}
		},
	}
}
</script>

<style lang="scss" scoped>
.ol-location {
	z-index: 0;
	left: 0.5em;
	top: calc(3.75em + 6px);
}
</style>