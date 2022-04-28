import { SupportedFormat } from './format';

class BrowserImage extends SupportedFormat {

	constructor(asset) {
		super(asset, 'ImageViewer', 'fa-image');
	}

	isBinary() {
		return true;
	}

	async fetchData() {
		let img = new Image();
		img.crossOrigin = 'anonymous';
		img.src = this.getUrl();
		return img;
	}

}

export default BrowserImage;