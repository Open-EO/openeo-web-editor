import contentType from 'content-type';

import BrowserImage from '../formats/browserImage';
import DataFile from './dataFile';
import DataInput from '../data/input';
import NativeType from './native';

const BROWSER_IMAGES = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'];
const BROWSER_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

// Used by the desktop app: everything except browser images and plain text is decoded by the data layer
export default class PreviewFormatRegistry {

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

	// Local files and directories, e.g. from a file picker or drag and drop
	createFilesFromLocal(inputs) {
		return inputs.map(input => {
			if (!(input instanceof DataInput)) {
				input = new DataInput({ blob: input });
			}
			const asset = {
				href: input.blob ? URL.createObjectURL(input.blob) : input.name,
				title: input.name,
				type: input.type
			};
			if (this.isBrowserImage(asset) && input.blob) {
				return new BrowserImage(asset);
			}
			return new DataFile(asset, null, input);
		});
	}

	isBrowserImage(asset) {
		try {
			if (typeof asset.type === 'string' && asset.type) {
				return BROWSER_IMAGES.includes(contentType.parse(asset.type.toLowerCase()).type);
			}
		} catch (error) {
			// invalid media type, check the extension
		}
		const name = asset.title || asset.href || '';
		return BROWSER_IMAGE_EXTENSIONS.includes(name.split(/[#?]/)[0].split('.').pop().toLowerCase());
	}

	createFileFromAsset(asset, stac) {
		try {
			if (typeof asset.type === 'string' && asset.type) {
				const mime = contentType.parse(asset.type.toLowerCase()).type;
				if (BROWSER_IMAGES.includes(mime)) {
					return new BrowserImage(asset);
				}
				if (mime === 'text/plain') {
					return new NativeType(asset);
				}
			}
			else if (this.isBrowserImage(asset)) {
				return new BrowserImage(asset);
			}
			else if (typeof asset.href === 'string' && asset.href.split(/[#?]/)[0].toLowerCase().endsWith('.txt')) {
				return new NativeType(asset);
			}
		} catch (error) {
			console.log(error);
		}
		// Everything else is detected by the data layer, which can read many more formats
		return new DataFile(asset, stac);
	}

}
