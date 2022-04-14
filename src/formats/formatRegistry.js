import contentType from 'content-type';

import BrowserImage from '../formats/browserImage';
import CSV from '../formats/csv';
import GeoJSON from '../formats/geojson';
import GeoTIFF from '../formats/geotiff';
import JSON_ from '../formats/json';
import NativeType from './native';
import TSV from '../formats/tsv';
import { UnsupportedFormat } from './format';

export default class FormatRegistry {

	constructor() {
	}

	createFilesFromSTAC(stac, resource = null) {
		let files = Object.values(stac.assets)
			.map(asset => this.createFileFromAsset(asset, stac));
		if (resource) {
			files.forEach(file => file.setContext(resource));
		}
		return files;
	}

	createFilesFromBlob(data) {
		if (!(data instanceof Blob)) {
			throw new Error("Given data is not a valid Blob");
		}
		return this.createFilesFromSTAC({
			assets: {
				result: {
					href: URL.createObjectURL(data),
					type: data.type
				}
			}
		});
	}

	createFileFromAsset(asset, stac) {
		let type = typeof asset.type === 'string' ? asset.type : 'application/octet-stream';
		try {
			let mime = contentType.parse(type.toLowerCase());
			switch(mime.type) {
				case 'image/png':
				case 'image/jpg':
				case 'image/jpeg':
				case 'image/gif':
				case 'image/webp':
					return new BrowserImage(asset);
				case 'application/json':
				case 'text/json':
					return new JSON_(asset);
				case 'application/geo+json':
					return new GeoJSON(asset);
				case 'text/plain':
					return new NativeType(asset);
				case 'text/csv':
					return new CSV(asset);
				case 'text/tab-separated-values':
					return new TSV(asset);
				case 'image/tiff':
					// We should check for the following, but not all back-ends send correct headers...
					// if (mime.parameters.application === 'geotiff') { ... }
					return new GeoTIFF(asset);
			}
		} catch (error) {
			console.log(error);
		}

		return new UnsupportedFormat(asset);
	}

}