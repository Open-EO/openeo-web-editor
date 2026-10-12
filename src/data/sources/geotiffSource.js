import { fromBlob, fromUrl, fromArrayBuffer, globals } from 'geotiff';
import RasterSource from './rasterSource';
import { resolveCrs } from '../crs';
import { toFloat32 } from '../stats';

const USER_DEFINED = 32767;
const PI = globals.photometricInterpretations;
// Color spaces that geotiff.js converts to RGB via readRGB
const CONVERT_TO_RGB = [PI.CMYK, PI.YCbCr, PI.CIELab];

function stacBands(asset) {
	if (!asset) {
		return [];
	}
	const lists = [asset.bands, asset['eo:bands'], asset['raster:bands']].filter(Array.isArray);
	const n = Math.max(0, ...lists.map(l => l.length));
	return Array.from({ length: n }, (_, i) => Object.assign({}, ...lists.map(l => l[i] || {})));
}

async function crsFromStac(stac, asset) {
	for (const obj of [asset, stac && stac.properties, stac]) {
		if (!obj) {
			continue;
		}
		const value = obj['proj:code'] || obj['proj:epsg'] || obj['proj:wkt2'] || obj['proj:projjson'];
		if (value) {
			const crs = await resolveCrs(value);
			if (crs) {
				return crs;
			}
		}
	}
	return null;
}

export default class GeoTiffSource extends RasterSource {

	static async open({ blob = null, url = null, buffer = null, headers = {}, asset = null, stac = null, title = null }) {
		let tiff;
		if (buffer) {
			tiff = await fromArrayBuffer(buffer);
		}
		else if (blob) {
			tiff = await fromBlob(blob);
		}
		else {
			tiff = await fromUrl(url, { headers, allowFullFile: true });
		}
		const source = new GeoTiffSource(tiff, title);
		await source.init(asset, stac);
		return source;
	}

	constructor(tiff, title) {
		super({ title });
		this.tiff = tiff;
		this.image = null;
		this.nodata = [];
	}

	// Writers may store SampleFormat/BitsPerSample once for all samples (allowed by libtiff/GDAL),
	// but geotiff.js expects one value per sample
	async expandPerSampleTags() {
		const count = await this.tiff.getImageCount();
		for (let i = 0; i < count; i++) {
			const fd = (await this.tiff.getImage(i)).fileDirectory;
			const n = fd.SamplesPerPixel || 1;
			for (const tag of ['SampleFormat', 'BitsPerSample']) {
				const values = fd[tag];
				if (values && values.length > 0 && values.length < n) {
					fd[tag] = Array.from({ length: n }, (_, s) => values[Math.min(s, values.length - 1)]);
				}
			}
		}
	}

	async init(asset, stac) {
		await this.expandPerSampleTags();
		const img = this.image = await this.tiff.getImage();
		this.width = img.getWidth();
		this.height = img.getHeight();
		const fd = img.fileDirectory;

		const extra = stacBands(asset);
		this.convertToRgb = CONVERT_TO_RGB.includes(fd.PhotometricInterpretation);
		const n = this.convertToRgb ? 3 : img.getSamplesPerPixel();
		this.bands = [];
		for (let i = 0; i < n; i++) {
			const gdal = img.getGDALMetadata(i) || {};
			const meta = extra[i] || {};
			const stats = meta.statistics || {};
			const band = {
				name: meta.name || gdal.DESCRIPTION || (this.convertToRgb ? ['Red', 'Green', 'Blue'][i] : `Band ${i + 1}`),
				description: meta.description || null,
				unit: meta.unit || gdal.UNITTYPE || null,
				min: Number.isFinite(stats.minimum) ? stats.minimum : (gdal.STATISTICS_MINIMUM ? parseFloat(gdal.STATISTICS_MINIMUM) : null),
				max: Number.isFinite(stats.maximum) ? stats.maximum : (gdal.STATISTICS_MAXIMUM ? parseFloat(gdal.STATISTICS_MAXIMUM) : null),
				scale: meta.scale || (gdal.SCALE ? parseFloat(gdal.SCALE) : 1),
				offset: meta.offset || (gdal.OFFSET ? parseFloat(gdal.OFFSET) : 0)
			};
			this.bands.push(band);
		}

		const stacNodata = asset && (asset['file:nodata'] || asset.nodata);
		if (Array.isArray(stacNodata)) {
			this.nodata = stacNodata;
		}
		else if (typeof stacNodata !== 'undefined') {
			this.nodata = [stacNodata];
		}
		const tiffNodata = img.getGDALNoData();
		if (tiffNodata !== null) {
			this.nodata.push(tiffNodata);
		}
		extra.forEach(b => typeof b.nodata !== 'undefined' && this.nodata.push(b.nodata));
		this.nodata = this.nodata.map(v => (typeof v === 'string' && v.toLowerCase() === 'nan') ? NaN : v);

		this.crs = await crsFromStac(stac, asset);
		if (!this.crs && img.geoKeys) {
			const { ProjectedCSTypeGeoKey: proj, GeographicTypeGeoKey: geog } = img.geoKeys;
			if (proj && proj !== USER_DEFINED) {
				this.crs = await resolveCrs(proj);
			}
			if (!this.crs && geog && geog !== USER_DEFINED) {
				this.crs = await resolveCrs(geog);
			}
		}
		try {
			this.bbox = img.getBoundingBox();
		} catch (error) {
			this.bbox = null;
		}
		if (!this.bbox) {
			this.crs = null;
			this.bbox = [0, 0, this.width, this.height];
		}

		if (fd.ColorMap && n === 1) {
			const map = Array.from(fd.ColorMap);
			const len = map.length / 3;
			this.palette = Array.from({ length: len }, (_, i) => [
				map[i] >> 8, map[i + len] >> 8, map[i + 2 * len] >> 8,
				this.nodata.includes(i) ? 0 : 255
			]);
		}

		const datetime = (asset && asset.datetime) || (stac && stac.properties && stac.properties.datetime);
		if (datetime) {
			this.times = [datetime];
		}
		this.attrs = { ...(img.getGDALMetadata() || {}) };
	}

	async read({ bbox, maxWidth, maxHeight }) {
		const window = this.windowFor(bbox || this.bbox);
		if (!window) {
			return null;
		}
		const step = this.readStep(window, maxWidth, maxHeight);
		const width = Math.max(1, Math.round((window[2] - window[0]) / step));
		const height = Math.max(1, Math.round((window[3] - window[1]) / step));
		const rasters = this.convertToRgb
			? await this.readRgb(window, width, height)
			: await this.tiff.readRasters({ window, width, height, resampleMethod: 'nearest', interleave: false });
		return {
			bbox: this.bboxForWindow(window),
			width,
			height,
			bands: Array.from(rasters).map((r, i) => toFloat32(r, this.nodata, this.bands[i].scale, this.bands[i].offset))
		};
	}

	// readRGB only exists per image, so pick the smallest overview with enough pixels
	async readRgb(window, width, height) {
		const count = await this.tiff.getImageCount();
		let best = this.image;
		for (let i = 1; i < count; i++) {
			const img = await this.tiff.getImage(i);
			// Bit 4 marks transparency masks
			if (img.fileDirectory.NewSubfileType & 4) {
				continue;
			}
			const factor = this.width / img.getWidth();
			if ((window[2] - window[0]) / factor >= width && img.getWidth() < best.getWidth()) {
				best = img;
			}
		}
		const f = this.width / best.getWidth();
		const scaled = [Math.floor(window[0] / f), Math.floor(window[1] / f), Math.ceil(window[2] / f), Math.ceil(window[3] / f)];
		const rgb = await best.readRGB({ window: scaled, width, height, resampleMethod: 'nearest', interleave: false });
		return [rgb[0], rgb[1], rgb[2]];
	}

	async readPixel(x, y) {
		const px = this.pixelAt(x, y);
		if (!px) {
			return [];
		}
		const window = [px[0], px[1], px[0] + 1, px[1] + 1];
		const rasters = this.convertToRgb
			? await this.image.readRGB({ window, interleave: false })
			: await this.image.readRasters({ window, interleave: false });
		const values = Array.from(rasters).map((r, i) => toFloat32(r, this.nodata, this.bands[i].scale, this.bands[i].offset)[0]);
		return [{ time: this.times ? this.times[0] : null, values }];
	}

	destroy() {
		if (this.tiff && typeof this.tiff.close === 'function') {
			this.tiff.close();
		}
	}

}
