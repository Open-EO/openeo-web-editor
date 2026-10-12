import RasterSource from './rasterSource';
import { toFloat32 } from '../stats';

// Raster view on n-dimensional variables (netCDF, HDF5, Zarr, CovJSON) that share an (y, x) grid.
// Each entry of `variables` is { variable, bandIndex } where bandIndex selects along `bandDim`, if any.
export default class NdRasterSource extends RasterSource {

	constructor(options, { variables, xDim, yDim, timeDim = null, bandDim = null, yAscending = false, decode }) {
		super(options);
		this.variables = variables;
		this.xDim = xDim;
		this.yDim = yDim;
		this.timeDim = timeDim;
		this.bandDim = bandDim;
		this.yAscending = yAscending;
		// variable => { nodata: [], scale, offset }
		this.decode = decode;
	}

	selection(variable, { time = 0, extra = {}, bandIndex = null, window = null, step = 1 }) {
		return variable.dims.map(dim => {
			if (dim === this.xDim) {
				return window ? [window[0], window[2], step] : null;
			}
			if (dim === this.yDim) {
				if (!window) {
					return null;
				}
				if (this.yAscending) {
					// Rows are stored south to north, so read the mirrored window and flip afterwards
					return [this.height - window[3], this.height - window[1], step];
				}
				return [window[1], window[3], step];
			}
			if (dim === this.timeDim) {
				return time;
			}
			if (dim === this.bandDim) {
				return bandIndex;
			}
			return extra[dim] || 0;
		});
	}

	async read({ bbox, maxWidth, maxHeight, time = 0, extra = {}, bands = null }) {
		const window = this.windowFor(bbox || this.bbox);
		if (!window) {
			return null;
		}
		const step = this.readStep(window, maxWidth, maxHeight);
		const width = Math.ceil((window[2] - window[0]) / step);
		const height = Math.ceil((window[3] - window[1]) / step);
		const indices = bands || this.variables.map((_, i) => i);
		const out = await Promise.all(this.variables.map(async ({ variable, bandIndex }, i) => {
			if (!indices.includes(i)) {
				return new Float32Array(width * height).fill(NaN);
			}
			const sel = this.selection(variable, { time, extra, bandIndex, window, step });
			const { data, shape } = await variable.read(sel);
			const d = this.decode(variable);
			let arr = toFloat32(data, d.nodata, d.scale, d.offset);
			// Remaining dims are ordered as in the variable, so transpose if x comes before y
			const xFirst = variable.dims.indexOf(this.xDim) < variable.dims.indexOf(this.yDim);
			const [h, w] = xFirst ? [shape[1], shape[0]] : [shape[0], shape[1]];
			if (xFirst) {
				const t = new Float32Array(arr.length);
				for (let r = 0; r < h; r++) {
					for (let c = 0; c < w; c++) {
						t[r * w + c] = arr[c * h + r];
					}
				}
				arr = t;
			}
			if (this.yAscending) {
				const flipped = new Float32Array(arr.length);
				for (let r = 0; r < h; r++) {
					flipped.set(arr.subarray((h - 1 - r) * w, (h - r) * w), r * w);
				}
				arr = flipped;
			}
			return arr;
		}));
		return { bbox: this.bboxForWindow(window), width, height, bands: out };
	}

	async readPixel(x, y, extra = {}) {
		const px = this.pixelAt(x, y);
		if (!px) {
			return [];
		}
		const window = [px[0], px[1], px[0] + 1, px[1] + 1];
		const series = await Promise.all(this.variables.map(async ({ variable, bandIndex }) => {
			const sel = this.selection(variable, { extra, bandIndex, window }).map((s, i) => variable.dims[i] === this.timeDim ? null : s);
			const { data } = await variable.read(sel);
			const d = this.decode(variable);
			return toFloat32(data, d.nodata, d.scale, d.offset);
		}));
		const times = this.times || [null];
		return times.map((time, t) => ({ time, values: series.map(s => s[t]) }));
	}

}
