export default class OSMGeocoder {
	constructor(url, geojson = false) {
		this.url = url;
		this.geojson = geojson;
	}

	getParameters(opt) {
		return {
			url: this.url,
			params: {
				q: opt.query,
				format: 'json',
				limit: 10,
				'accept-language': 'en',
				polygon_geojson: this.geojson ? 1 : 0,
				polygon_threshold: 0.001,
			},
		};
	}

	handleResponse(results) {
		if (results.length === 0) {
			return [];
		}
		return results
			.filter(result => ["boundary", "geological", "leisure", "natural", "place", "water", "waterway"].includes(result.class))
			.map(result => ({
				lon: result.lon,
				lat: result.lat,
				bbox: result.boundingbox,
				address: {
					name: result.display_name
				},
				original: {
					formatted: result.display_name,
					details: result.address,
					geojson: result.geojson
				}
			}));
	}
}