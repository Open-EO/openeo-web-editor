import contentType from 'content-type';

import BrowserImage from '../formats/browserImage';
import CSV from '../formats/csv';
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
			.filter(asset => !Array.isArray(asset.roles) || !asset.roles.includes("metadata"))
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
			stac_version: "1.0.0",
			type: "Feature",
			geometry: null,
			properties: {},
			links: [],
			assets: {
				result: {
					href: URL.createObjectURL(data),
					blob: data,
					type: data.type
				}
			}
		});
	}

	createFileFromAsset(asset, stac) {
		try {
			// Detect by media type
			if (typeof asset.type === 'string') {
				let mime = contentType.parse(asset.type.toLowerCase());
				switch(mime.type) {
					case 'image/png':
					case 'image/jpg':
					case 'image/jpeg':
					case 'image/gif':
					case 'image/webp':
						return new BrowserImage(asset);
					case 'application/json':
					case 'text/json':
					case 'application/geo+json':
						return new JSON_(asset);
					case 'text/plain':
						return new NativeType(asset);
					case 'text/csv':
						return new CSV(asset);
					case 'text/tab-separated-values':
						return new TSV(asset);
					case 'image/tiff':
						return new GeoTIFF(asset, stac);
				}
			}
			
			// Fallback: Detect by file extension
			if (typeof asset.href === 'string') {
				let extension = asset.href.split(/[#?]/)[0].split('.').pop().trim().toLowerCase();
				switch(extension) {
					case 'png':
					case 'jpg':
					case 'jpeg':
					case 'gif':
					case 'webp':
						return new BrowserImage(asset);
					case 'json':
					case 'geojson':
						return new JSON_(asset);
					case 'txt':
						return new NativeType(asset);
					case 'csv':
						return new CSV(asset);
					case 'tsv':
						return new TSV(asset);
					case 'tif':
					case 'tiff':
						return new GeoTIFF(asset, stac);
				}
			}

		} catch (error) {
			console.log(error);
		}

		return new UnsupportedFormat(asset);
	}

}