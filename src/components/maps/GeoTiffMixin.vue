<script>
import Utils from '../../utils.js';

import TextControl from './TextControl.vue';
import ChannelControl from './ChannelControl.vue';

import TileLayer from 'ol/layer/WebGLTile';
import GeoTIFF from 'ol/source/GeoTIFF';

export default {
	components: {
		ChannelControl,
		TextControl
	},
	data() {
		return {
			textControlText: 'Pixel Value: -',
			hasStyle: false,
			layer: null,
			source: null,
			channels: [],
			bands: []
		}
	},
	computed: {
		glStyleVars() {
			if (this.channels.length === 0) {
				return null;
			}
			let vars = {};
			for(let i in this.channels) {
				let channel = this.channels[i];
				vars[`${i}band`] = channel.id;
				vars[`${i}min`] = channel.min;
				vars[`${i}max`] = channel.max;
			}
			return vars;
		},
		glStyle() {
			let color = ['color'];
			if (this.channels.length === 0) {
				return null;
			}
			else if (this.channels.length === 1) {
				let formula = this.getFormula(0);
				color.push(formula);
				color.push(formula);
				color.push(formula);
				if (this.source && this.source.addAlpha_) {
					color.push(['band', this.bands.length + 1]);
				}
			}
			else {
				color.push(this.getFormula(0));
				color.push(this.getFormula(1));
				color.push(this.getFormula(2));
				if (this.source && this.source.addAlpha_) {
					color.push(['band', this.bands.length + 1]);
				}
			}
			return {variables: this.glStyleVars, color};
		}
	},
	methods: {
		getBandVar(i) {
			return ['band', ['var', `${i}band`]];
		},
		getFormula(i) {
			let min = ['var', `${i}min`];
			let max = ['var', `${i}max`];
			let x = this.getBandVar(i);
			return ['*', ['/', ['-', x, min], ['-', max, min]], 255]; // Linear scaling from min - max to 0 - 255
		},
		async addGeoTiff(geotiff, title = "GeoTiff") {
			// Get Bands
			this.bands = geotiff.getBands();
			// Create OL GeoTiff Source
			this.source = new GeoTIFF({
				normalize: false,
				sources: [
					{
						url: geotiff.getUrl(),
						nodata: geotiff.getNoData()
					}
				]
			});
			// Add layer
			this.layer = new TileLayer({
				id: geotiff.getUrl(),
				title,
				source: this.source
			});
			this.layer.set('events', {
				pointermove: evt => {
					let pixelData = this.layer.getData(evt.pixel);
					let value = Utils.displayRGBA(pixelData);
					let valueText = `Pixel Value: ${value}`;
					this.textControlText = [valueText, `${valueText} @ ${evt.coordinate.map(x => String(x.toFixed(6)).replace(/0+$/, '')).join(', ')}`];
				}
			});
			this.addLayerToMap(this.layer);

			let extent = geotiff.getExtent();
			if (extent) {
				this.map.getView().fit(extent, this.getFitOptions(10));
			}

			return this.source;
		},

		updateGeoTiffStyle(type, data) {
			switch(type) {
				case 'channels': 
					this.channels = data;
					break;
			}
			if (this.layer) {
				if (!this.hasStyle) {
					this.layer.setStyle(this.glStyle);
					this.hasStyle = true;
				}
				else {
					this.layer.updateStyleVariables(this.glStyleVars);
				}
			}
		}
	}
}
</script>