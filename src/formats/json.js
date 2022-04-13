import { SupportedFormat } from './format';

class JSON_ extends SupportedFormat {

	constructor(asset, component = "DataViewer") {
		super(asset, component);
	}

	async parseData(data) {
		if (typeof data === 'string') {
			try {
				return JSON.parse(data);
			}
			catch (error) {
				console.log(error);
			}
		}
		return data;
	}
}

export default JSON_;