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
			colorMap: null,
			noData: [],
			channels: [],
			bands: []
		}
	},
	computed: {
		glStyleVars() {
			let vars = {};
			for(let i in this.channels) {
				let channel = this.channels[i];
				vars[`${i}band`] = channel.id;
				vars[`${i}min`] = channel.min;
				vars[`${i}max`] = channel.max;
			}
			return vars;
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
		getNoDataFormula() {
			let band = ['band', this.bands.length + 1];
			// This is a workaround until I know what the range is... see https://github.com/openlayers/openlayers/issues/13588
			/*let formula = ['match', band];
			this.noData.forEach(value => {
				formula.push(value);
				formula.push(0);
			});
			formula.push(1);
			return formula; */
			return ['clamp', band, 0, 1];
			// return ['/', band, 255];
		},
		async addGeoTiff(geotiff, title = "GeoTiff") {
			this.bands = geotiff.getBands();
			this.colorMap = geotiff.getColorMap();
			this.noData = geotiff.getNoData();

			this.source = new GeoTIFF({
				interpolate: false,
				normalize: false,
				convertToRGB: geotiff.convertToRGB,
				sources: [
					{
						url: geotiff.getUrl(),
						nodata: this.noData[0] // OL only supports passing one no data value
					}
				]
			});

			this.layer = new TileLayer({
				id: geotiff.getUrl(),
				title,
				source: this.source,
				cacheSize: 2048 // https://github.com/openlayers/openlayers/issues/13670
			});
			this.layer.set('events', {
				pointermove: evt => {
					let pixelData = this.layer.getData(evt.pixel);
					let value = Utils.displayRGBA(pixelData, this.noData, this.noData.length > 0);
					let valueText = `Pixel Value: ${value}`;
					this.textControlText = [valueText, `${valueText} @ ${evt.coordinate.map(x => String(x.toFixed(6)).replace(/0+$/, '')).join(', ')}`];
				}
			});
			this.addLayerToMap(this.layer);

			let extent = geotiff.getExtent();
			if (extent) {
				this.map.getView().fit(extent, this.getFitOptions(10));
			}

			if (this.colorMap) {
				this.setStyle();
			}

			return this.source;
		},

		updateGeoTiffStyle(type, data) {
			switch(type) {
				case 'channels': 
					this.channels = data;
					break;
			}
			this.setStyle();
		},

		setStyle() {
			if (!this.layer) {
				return;
			}
			if (!this.hasStyle) {
				// Create style
				let color = [];
				if (this.colorMap) {
					color.push('palette');
					color.push(['band', 1]);
					color.push(this.colorMap);
				}
				else if (this.channels.length === 0) {
					return null;
				}
				else if (this.channels.length === 1) {
					color.push('color');
					let formula = this.getFormula(0);
					color.push(formula);
					color.push(formula);
					color.push(formula);
					if (this.noData.length > 0) {
						color.push(this.getNoDataFormula());
					}
				}
				else {
					color.push('color');
					color.push(this.getFormula(0));
					color.push(this.getFormula(1));
					color.push(this.getFormula(2));
					if (this.noData.length > 0) {
						color.push(this.getNoDataFormula());
					}
				}
				let style = {variables: this.glStyleVars, color};
				// Set style
				this.layer.setStyle(style);
				this.hasStyle = true;
			}
			else {
				//this.layer.updateStyleVariables(this.glStyleVars);
			}
		}
	}
}
</script>