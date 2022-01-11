import XYZ from 'ol/source/XYZ';
import { toSize } from 'ol/size';

export default class ProjGeoTiff extends XYZ {

	constructor(opts, geotiff) {
		super(Object.assign({
			tileGrid: geotiff.getTileGrid(),
			url: '{z},{x},{y}',
			interpolate: false,
			tileLoadFunction: (imageTile, coordString) => this.tileLoadFunction_(imageTile, coordString)
		}, opts));
		this.geotiff = geotiff;
	}

	tileLoadFunction_(imageTile, coordString) {
		const coord = coordString.split(',').map(Number);
		const tile = this.geotiff.getTile(coord[0], coord[1], coord[2], 1, this.getProjection());
		const tileState = tile.getState();
		if (tileState == 2) {
			this.setImage_(tile, imageTile, coord);
		} else {
			const listener = () => {
				const tileState = tile.getState();
				if (tileState != 1) {
					tile.removeEventListener('change', listener);
					this.setImage_(tile, imageTile, coord);
				}
			};
			tile.addEventListener('change', listener);
			tile.load();
		}
	}

	setImage_(tile, imageTile, coord) {
		const size = toSize(this.geotiff.getTileGrid().getTileSize(coord[0]));
		const data = tile.getData();
		const canvas = this.dataToCanvas(data, size);
		imageTile.getImage().src = canvas.toDataURL();
	}

	dataToCanvas(data, size) {
		if (data instanceof Float32Array) {
			throw new Error("Float32 currently not supported.");
		}
		const width = size[0];
		const height = size[1];
		const bytesPerRow = data.byteLength / height;
		const bandCount = Math.floor(bytesPerRow / width);

		if (bandCount <= 4) {
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const context = canvas.getContext('2d');
			const imgData = context.getImageData(0, 0, width, height);
			const pixels = imgData.data;

			let pixelIndex = 0;
			let rowOffset = 0;
			const colCount = width * bandCount;
			for (let rowIndex = 0; rowIndex < height; ++rowIndex) {
				for (let colIndex = 0; colIndex < colCount; colIndex += bandCount) {
					const dataIndex = rowOffset + colIndex;
					pixels[pixelIndex++] = data[dataIndex];
					pixels[pixelIndex++] = data[dataIndex + (bandCount < 3 ? 0 : 1)];
					pixels[pixelIndex++] = data[dataIndex + (bandCount < 3 ? 0 : 2)];
					pixels[pixelIndex++] =
						bandCount % 2 == 1
							? 255
							: data[dataIndex + (bandCount < 3 ? 1 : 3)];
				}
				rowOffset += bytesPerRow;
			}
			context.putImageData(imgData, 0, 0);
			return canvas;
		}
	}

}