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
			layer: null,
			source: null,
			colorMap: null,
			noData: [],
			channels: [],
			bands: []
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
			let scale = ['*', ['/', ['-', x, min], ['-', max, min]], 255]; // Linear scaling from min - max to 0 - 255
			return ['clamp', scale, 0, 255]; // clamp values in case we get cales < 0 or > 255
		},
		getNoDataFormula() {
			let band = this.getBandVar('alpha');
			// https://github.com/openlayers/openlayers/issues/13588#issuecomment-1125317573
			// return ['clamp', band, 0, 1];
			// return ['/', band, 255];
			return ['case', ['==', band, 0], 0, 1];
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
					let coords = this.formatCoords(evt.coordinate);
					this.textControlText = [valueText, `${valueText} @ ${coords}`];
				},
				click: evt => {
					let data = this.layer.getData(evt.pixel);
					if (!data) {
						this.chart = null;
						return;
					}

					data = Array.from(data).slice(0, this.bands.length);
					if (data.length < 2 || data.every(x => !isFinite(x))) {
						this.chart = null;
						return;
					}

					let coords = this.formatCoords(evt.coordinate);
					let label = `Coordinate: ${coords}`;

					let datasets = [{ label, data }];

					this.chart = {
						labels: this.bands.map(band => String(band.name || band.id)),
						datasets
					};
				}
			});
			this.addLayerToMap(this.layer);

			let extent = geotiff.getExtent();
			if (extent) {
				this.map.getView().fit(extent, this.getFitOptions(10));
			}

			// Hack to get the initial style set.
			// Not sure yet why this needs a delay -> TODO
			await new Promise(r => setTimeout(r, 1250));
			this.setStyle();

			return this.source;
		},
		formatCoords(coords) {
			return coords.map(x => String(parseFloat(x.toFixed(6)))).join(', ');
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

			// Compute variables
			let variables = {};
			for(let i in this.channels) {
				let channel = this.channels[i];
				variables[`${i}band`] = channel.id;
				variables[`${i}min`] = channel.min;
				variables[`${i}max`] = channel.max;
			}
			variables.alphaband = this.bands.length + 1;

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

			// Set style
			this.layer.setStyle({variables, color});
		}
	}
}
</script>