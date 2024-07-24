<template>
	<div class="ol-add-data ol-unselectable ol-control" style="pointer-events: auto;">
		<button type="button" @click.prevent.stop="openModal" title="Add external data source">
			<i class="fas fa-image"></i>
		</button>
	</div>
</template>

<script>
import ControlMixin from './ControlMixin';
import EventBusMixin from '../EventBusMixin';

export default {
	name: 'AddDataControl',
	mixins: [
		ControlMixin,
		EventBusMixin
	],
	methods: {
		openModal() {
			let events = {
				save: this.addLayer
			};
			this.broadcast('showModal', 'AddMapDataModal', {}, events);
		},
		addLayer(file) {
			this.$emit('add', file);
		}
	}
}
</script>

<style lang="scss" scoped>
.ol-add-data {
	z-index: 0;
	right: 0.5em;
	top: 4.875em
}
</style>