<template>
	<div class="step choose-bbox">
		<p>Please select the area of interest which you want to download data for. You can add or remove a bounding box by clicking into the map.</p>
		<MapAreaSelect class="map" :show="showMap" :value="value" :showMaxExtent="max" @input="update" />
	</div>
</template>

<script>
import MapAreaSelect from '../../maps/MapAreaSelect.vue';

export default {
	name: 'ChooseBoundingBox',
	components: {
		MapAreaSelect
	},
	props: {
		value: {
			type: Object,
			default: null
		},
		max: {
			type: Object,
			default: null
		}
	},
	data() {
		return {
			showMap: true
		};
	},
	mounted() {
		window.setTimeout(() => this.showMap = true, 1000);
	},
	methods: {
		update(bbox) {
			this.$emit('input', bbox);
		}
	}
}
</script>

<style lang="scss" scoped>
.choose-bbox, .map {
	display: flex;
	flex-direction: column;
	flex-grow: 1;
}
</style>