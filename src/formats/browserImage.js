import { SupportedFormat } from './format';

class BrowserImage extends SupportedFormat {

	constructor(asset) {
		super(asset, 'ImageViewer', 'fa-image');
	}

	isBinary() {
		return true;
	}

	async fetchData() {
		return new Promise((resolve, reject) => {
			let img = new Image();
			img.crossOrigin = 'anonymous';
			img.onerror = () => reject(new Error('Failed to load the image'));
			img.onload = () => resolve(img);
			img.fetchPriotity = 'high';
			img.decoding = 'sync';
			img.src = this.getUrl();
		});
	}

}

export default BrowserImage;