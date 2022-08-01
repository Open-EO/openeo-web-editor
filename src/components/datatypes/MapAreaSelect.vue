<template>
	<div :id="id">
		<ProgressControl ref="progress" :map="map" />
		<TextControl :text="help" :map="map" />
	</div>
</template>

<script>
import MapMixin from '../maps/MapMixin.vue';
import Utils from '../../utils.js';
import ExtentInteraction from 'ol/interaction/Extent';
import { transformExtent } from 'ol/proj';
import { containsXY } from 'ol/extent';
import { createDefaultStyle } from 'ol/style/Style';
import TextControl from '../maps/TextControl.vue';

export default {
	name: 'MapAreaSelect',
	mixins: [MapMixin],
	components: {
		TextControl
	},
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
		let extent = null;
		if (Utils.isObject(this.value) && "west" in this.value && "south" in this.value && "east" in this.value && "north" in this.value) {
			extent = [this.value.west, this.value.south, this.value.east, this.value.north];
		}
		else if (Array.isArray(this.value) && value.length >= 4) {
			extent = this.value;
		}

		return {
			interaction: null,
			extent
		};
	},
	computed: {
		returnAsObject() {
			return !Array.isArray(this.value); // Only return as array if value given in prop is also an array
		},
		projectedExtent() {
			if (this.extent) {
				return transformExtent(this.extent, 'EPSG:4326', this.map.getView().getProjection());
			}
			return null;
		},
		bbox() {
			return Utils.extentToBBox(this.extent);
		},
		help() {
			return this.extent ? 'Click inside the bounding box to remove it.' : 'Click on the map to add a bounding box.';
		}
	},
	methods: {
		update(event) {
			if (event.extent) {
				this.extent = transformExtent(event.extent, this.map.getView().getProjection(), 'EPSG:4326');
			}
			else {
				this.extent = null;
			}
			this.$emit('input', this.returnAsObject ? this.bbox : this.extent);
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
		async renderMap() {
			let isWebMercatorCompatible = Utils.isBboxInWebMercator(this.bbox) !== false;
			
			await this.createMap(isWebMercatorCompatible ? 'EPSG:3857' : 'EPSG:4326');
			this.addBasemaps();

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
					else if (containsXY(this.projectedExtent, ...event.coordinate)) {
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
				extent: this.projectedExtent,
				condition,
				boxStyle: createDefaultStyle(),
				pixelTolerance: 15
			});

			// let oldImplementation = this.interaction.setExtent.bind(this.interaction);
			// this.interaction.setExtent = extent => oldImplementation(this.ensureValidExtent(extent));
			if (this.editable) {
				this.interaction.on('extentchanged', this.update);
			}

			this.map.addInteraction(this.interaction);

			// If not ediable, make a bigger extent visible so that user can get a better overview
			if (this.projectedExtent) {
				var fitOptions = this.getFitOptions(this.editable ? 10 : 33);
				this.map.getView().fit(this.projectedExtent, fitOptions);
			}
		}
	}

}
</script>

<style src="../maps/MapMixin.css"></style>