<template>
	<div class="step choose-bbox">
		<p>Please select the area of interest which you want to download data for.</p>
		<MapAreaSelect class="map" :show="showMap" :value="value" @input="update" />
	</div>
</template>

<script>
import MapAreaSelect from '../../datatypes/MapAreaSelect.vue';

export default {
	name: 'ChooseBoundingBox',
	components: {
		MapAreaSelect
	},
	props: {
		value: {
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