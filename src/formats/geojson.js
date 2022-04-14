import JSON from './json';

class GeoJSON extends JSON {

	constructor(asset) {
		super(asset, "MapViewer");
	}

	getIcon() {
		return 'fa-map';
	}

}

export default GeoJSON;