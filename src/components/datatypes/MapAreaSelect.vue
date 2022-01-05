<template>
	<div :id="id"></div>
</template>

<script>
import MapMixin from '../maps/MapMixin.vue';
import Utils from '../../utils.js';
import ExtentInteraction from 'ol/interaction/Extent';
import { containsXY } from 'ol/extent';
import { createDefaultStyle } from 'ol/style/Style';

export default {
	name: 'MapAreaSelect',
	mixins: [MapMixin],
	props: {
		// Either Object or Array, doesn't support the z-axis
		// Array is always in WGS84 with the following elements: 0 => west, 1 => south, 2 => east, 3 => north
		// Object is an bbox object as defined by the openEO API (with west, south, east, north properties).
		value: {
			type: [Object, Array],
			default: () => null
		}
	},
	data() {
		let extent;
		if (Utils.isObject(this.value)) {
			extent = [this.value.west, this.value.south, this.value.east, this.value.north];
		}
		else {
			extent = this.value;
		}
		return {
			interaction: null,
			extent
		};
	},
	methods: {
		update(event) {
			let extent = event.extent;
			this.extent = extent;

			if (extent && !Array.isArray(this.value)) {
				extent = {
					west: extent[0],
					south: extent[1],
					east: extent[2],
					north: extent[3]
				};
			}

			this.$emit('input', extent);
		},
		ensureValidExtent(extent) {
			if (!extent) {
				return extent;
			}
			return [
				Math.max(extent[0], -180),
				Math.max(extent[1], -90),
				Math.min(extent[2], 180),
				Math.min(extent[3], 90)
			];
		},
		renderMap() {
			this.createMap(false, 'EPSG:4326');

			let condition = (event) => {
				if (!this.editable) {
					return false;
				}

				if (event.type === 'singleclick') {
					if (!this.extent) {
						let pixelSize = this.map.getSize().map(xy => xy * 0.2);
						let extent = this.map.getView().calculateExtent(pixelSize);
						let size = [
							extent[2] - extent[0],
							extent[3] - extent[1]
						];
						let mouseExtent = [
							event.coordinate[0] - size[0],
							event.coordinate[1] - size[1],
							event.coordinate[0] + size[0],
							event.coordinate[1] + size[1],
						];
						this.interaction.setExtent(mouseExtent);
						return false;
					}
					else if (containsXY(this.extent, ...event.coordinate)) {
						this.interaction.setExtent(null);
						this.interaction.vertexOverlay_.getSource().clear();
						this.interaction.vertexFeature_ = null;
					}
				}
				else if (this.interaction.handlingDownUpSequence || this.interaction.snapToVertex_(event.pixel, event.map)) {
					return true;
				}
				return false;
			};

			this.interaction = new ExtentInteraction({
				extent: this.extent,
				condition,
				boxStyle: createDefaultStyle(),
				pixelTolerance: 15
			});

			let oldImplementation = this.interaction.setExtent.bind(this.interaction);
			this.interaction.setExtent = extent => oldImplementation(this.ensureValidExtent(extent));
			if (this.editable) {
				this.interaction.on('extentchanged', this.update);
			}

			this.map.addInteraction(this.interaction);

			// If not ediable, make a bigger extent visible so that user can get a better overview
			if (this.extent) {
				var fitOptions = this.getFitOptions(this.editable ? 10 : 33);
				this.map.getView().fit(this.extent, fitOptions);
			}
		}
	}

}
</script>

<style src="../maps/MapMixin.css"></style>