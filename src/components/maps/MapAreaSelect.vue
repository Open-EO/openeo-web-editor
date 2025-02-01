<template>
	<div :id="id">
		<ProgressControl ref="progress" :map="map" />
		<UserLocationControl :map="map" />
		<TextControl :text="help" :map="map" />
	</div>
</template>

<script>
import GeoJsonMixin from './ExtentMixin.vue';
import GeocoderMixin from './GeocoderMixin.vue';
import MapMixin from './MapMixin.vue';
import Utils from '../../utils.js';
import {shiftKeyOnly} from 'ol/events/condition.js';
import ExtentInteraction from 'ol/interaction/Extent';
import { transformExtent } from 'ol/proj';
import { containsXY } from 'ol/extent';
import Style, { createDefaultStyle } from 'ol/style/Style';
import TextControl from './TextControl.vue';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';

export default {
	name: 'MapAreaSelect',
	mixins: [
		GeoJsonMixin,
		GeocoderMixin,
		MapMixin
	],
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
		},
		showMaxExtent: {
			type: [Object, Array],
			default: () => null
		}
	},
	data() {
		return {
			interaction: null,
			extent: this.toExtent(this.value)
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
		outerArea() {
			if (!this.showMaxExtent) {
				return null;
			}
			let {west, east, north, south} = this.showMaxExtent;
			return {
				"type": "Polygon",
				"coordinates": [
					[
						[-180, 90],
						[-180, -90],
						[180, -90],
						[180, 90],
						[-180, 90]
					],
					[
						[west, north],
						[west, south],
						[east, south],
						[east, north],
						[west, north]
					]
				]
			};
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
		async renderMap() {
			let isWebMercatorCompatible = Utils.isBboxInWebMercator(this.bbox) !== false;
			
			await this.createMap(isWebMercatorCompatible ? 'EPSG:3857' : 'EPSG:4326');
			this.addBasemaps();
			this.addGeocoder(bbox => {
				if (!bbox) {
					return;
				}
				let extent = this.toExtent(bbox);
				extent = transformExtent(extent, 'EPSG:4326', this.map.getView().getProjection());
				this.interaction.setExtent(extent);
				this.fitMap();
			});
			if (this.showMaxExtent) {
				const style = new Style({
					fill: new Fill({ color: '#00000099' }),
					stroke: new Stroke({ width: 0, color: '#00000000' })
				});
				this.addGeoJson(this.outerArea, false, "unsupported area", style);

				let extent = this.toExtent(this.showMaxExtent);
				extent = transformExtent(extent, 'EPSG:4326', this.map.getView().getProjection());
				this.map.getView().fit(extent, this.getFitOptions(1));
			}

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
        return shiftKeyOnly(event);
			};

			this.interaction = new ExtentInteraction({
				extent: this.projectedExtent,
				condition,
				boxStyle: createDefaultStyle()
			});

			if (this.editable) {
				this.interaction.on('extentchanged', this.update);
			}

			this.map.addInteraction(this.interaction);
			this.fitMap();
		},
		fitMap() {
			// If not ediable, make a bigger extent visible so that user can get a better overview
			if (this.projectedExtent) {
				var fitOptions = this.getFitOptions(this.editable ? 10 : 33);
				this.map.getView().fit(this.projectedExtent, fitOptions);
			}
		}
	}

}
</script>

<style src="../maps/MapMixin.scss" lang="scss"></style>