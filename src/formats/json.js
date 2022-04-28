import Utils from '../utils';
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
				data = JSON.parse(data);
			}
			catch (error) {
				console.log(error);
			}
		}
		if (Utils.detectGeoJson(data)) {
			this.isGeoJson = true;
			this.component = 'MapViewer';
			this.icon = 'fa-map';
		}
		return data;
	}
}

export default JSON_;