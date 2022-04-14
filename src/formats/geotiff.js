import { SupportedFormat } from './format';

import GeoTIFFSource from 'ol/source/GeoTIFF';

class GeoTIFF extends SupportedFormat {

	constructor(asset) {
		super(asset, "MapViewer", {removableLayers: true});
		this.view = null;
	}

	getIcon() {
		return 'fa-map';
	}

	isBinary() {
		return true;
	}

	canGroup() {
		return true;
	}

	getView() {
		return this.view;
	}

	async getData() {
		let geotiff = new GeoTIFFSource({ sources: [{
			url: this.getUrl()
		}] });
		this.view = await geotiff.getView();
		return geotiff;
	}

}

export default GeoTIFF;