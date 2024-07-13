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
		else if (this.isTable(data)) {
			this.component = 'TableViewer';
			this.icon = 'fa-table';
		}
		return data;
	}

	isTable(data) {
		if (!data || typeof data !== 'object' || Utils.size(data) === 0) {
			return false;
		}
		let values = Object.values(data);
		let keys = Object.keys(values[0]);
		return !values.some(row => !row || typeof row !== 'object' || !Utils.equals(Object.keys(row), keys));
	}
}

export default JSON_;