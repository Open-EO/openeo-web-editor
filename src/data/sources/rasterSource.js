// Common interface for all raster data, independent of the file format.
// bbox is [minx, miny, maxx, maxy] in the native CRS, rows are returned north to south.
export default class RasterSource {

	constructor({ title = null, crs = null, bbox = null, width = 0, height = 0, bands = [], times = null, extraDims = [], palette = null, attrs = {} } = {}) {
		this.title = title;
		this.crs = crs;
		this.bbox = bbox;
		this.width = width;
		this.height = height;
		// [{ name, unit, description }]
		this.bands = bands;
		// ISO strings or null
		this.times = times;
		// [{ name, values }] for dimensions other than x, y, time and bands
		this.extraDims = extraDims;
		this.palette = palette;
		this.attrs = attrs;
	}

	isGeoreferenced() {
		return Boolean(this.crs && this.bbox);
	}

	get resolution() {
		return [(this.bbox[2] - this.bbox[0]) / this.width, (this.bbox[3] - this.bbox[1]) / this.height];
	}

	// Pixel window [x0, y0, x1, y1] (exclusive end) covering the bbox, clipped to the raster
	windowFor(bbox) {
		const [rx, ry] = this.resolution;
		const x0 = Math.max(0, Math.floor((bbox[0] - this.bbox[0]) / rx));
		const x1 = Math.min(this.width, Math.ceil((bbox[2] - this.bbox[0]) / rx));
		const y0 = Math.max(0, Math.floor((this.bbox[3] - bbox[3]) / ry));
		const y1 = Math.min(this.height, Math.ceil((this.bbox[3] - bbox[1]) / ry));
		if (x1 <= x0 || y1 <= y0) {
			return null;
		}
		return [x0, y0, x1, y1];
	}

	bboxForWindow([x0, y0, x1, y1]) {
		const [rx, ry] = this.resolution;
		return [this.bbox[0] + x0 * rx, this.bbox[3] - y1 * ry, this.bbox[0] + x1 * rx, this.bbox[3] - y0 * ry];
	}

	pixelAt(x, y) {
		const [rx, ry] = this.resolution;
		const col = Math.floor((x - this.bbox[0]) / rx);
		const row = Math.floor((this.bbox[3] - y) / ry);
		if (col < 0 || row < 0 || col >= this.width || row >= this.height) {
			return null;
		}
		return [col, row];
	}

	// Reads the given bbox, downsampled to at most maxWidth x maxHeight.
	// Returns { bbox, width, height, bands: Float32Array[] } with no-data as NaN.
	// eslint-disable-next-line no-unused-vars
	async read({ bbox, maxWidth, maxHeight, time = 0, extra = {}, bands = null }) {
		throw new Error('Not implemented');
	}

	// Returns values for all times at the given native coordinate: [{ time, values: [per band] }]
	// eslint-disable-next-line no-unused-vars
	async readPixel(x, y, extra = {}) {
		return [];
	}

	readStep(window, maxWidth, maxHeight) {
		const w = window[2] - window[0];
		const h = window[3] - window[1];
		return Math.max(1, Math.ceil(Math.max(w / maxWidth, h / maxHeight)));
	}

	destroy() {}

}
