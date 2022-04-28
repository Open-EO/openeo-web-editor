import { Utils } from '@openeo/js-commons';
import { SupportedFormat } from './format';

class JSON_ extends SupportedFormat {

	constructor(asset, component = "DataViewer") {
		super(asset, component);

		this.isGeoJson = false;
		// this.isCovJson = false;
	}

	async parseData(data) {
		if (typeof data === 'string') {
			try {
				let json = JSON.parse(data);
				if (Utils.detectGeoJson(json)) {
					this.isGeoJson = true;
					this.component = 'MapViewer';
					this.icon = 'fa-map';
				}
			}
			catch (error) {
				console.log(error);
			}
		}
		return data;
	}
}

export default JSON_;