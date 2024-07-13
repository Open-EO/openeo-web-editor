export default class GeoTiffState {

	constructor(geotiff) {
		this.layer = null;
		this.colorMap = geotiff.getColorMap();
		this.noData = geotiff.getNoData();
		this.bands = geotiff.getBands();
		this.defaultChannels = this.bands.slice(0, 3);
		this.channels = this.bands.slice(0, 3);
    this.file = geotiff;
	}

	getBandVar(i) {
		return ['band', ['var', `${i}band`]];
	}

	getFormula(i) {
		let min = ['var', `${i}min`];
		let max = ['var', `${i}max`];
		let x = this.getBandVar(i);
		let scale = ['*', ['/', ['-', x, min], ['-', max, min]], 255]; // Linear scaling from min - max to 0 - 255
		return ['clamp', scale, 0, 255]; // clamp values in case we get cales < 0 or > 255
	}

	getNoDataFormula() {
		let band = this.getBandVar('alpha');
		// https://github.com/openlayers/openlayers/issues/13588#issuecomment-1125317573
		// return ['clamp', band, 0, 1];
		// return ['/', band, 255];
		return ['case', ['==', band, 0], 0, 1];
	}

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
