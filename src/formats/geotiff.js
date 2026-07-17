import { SupportedFormat } from './format';
import Utils from '../utils';
import ProjManager from '../components/maps/projManager';

import { fromUrl as tiffFromUrl, fromBlob as tiffFromBlob, globals as _ } from 'geotiff';

import { toUserExtent } from 'ol/proj';
import Projection from 'ol/proj/Projection';
import { fromCode as unitsFromCode } from 'ol/proj/Units';

const GDAL_MIN = 'STATISTICS_MINIMUM';
const GDAL_MAX = 'STATISTICS_MAXIMUM';
const GDAL_NAME = 'DESCRIPTION';

class GeoTIFF extends SupportedFormat {

	constructor(asset, stac) {
		super(asset, "MapViewer", 'fa-map', { removableLayers: true });
		this._bands = [];
		this._nodata = [];
		this.img = null;
		this.projection = null;
		this.extent = null;
		this.convertToRGB = false;
		this.stac = stac;
	}

	isBinary() {
		return true;
	}

	canGroup() {
		return true;
	}

	async loadData(connection) {
		if (!this.loaded) {
			await this.parseMetadata();
			this.loaded = true;
		}
		return this;
	}

	getData() {
		return this;
	}

	async parseMetadata() {
		let stacHasExtent = this.stac && (this.stac.geometry || this.stac.extent);

		// Get projection from STAC
		this.projection = await ProjManager.addFromStac(this.stac);

		// Get nodata from STAC file:nodata
		if (Array.isArray(this['file:nodata']) && this['file:nodata'].length > 0) {
			this._nodata = Utils.parseNodata(this['file:nodata']);
		}

		// Get min/max/nodata from STAC bands
		if (Array.isArray(this.bands) && this.bands.length > 0) {
			this.bands.forEach((band, i) => {
				// Get name from band
				if (band.name) {
					this.setBandInfo(i, {
						name: band.name
					});
				}

				// Set min/max from statistics
				if (Utils.isObject(band.statistics)) {
					this.setBandInfo(i, {
						min: band.statistics.minimum,
						max: band.statistics.maximum
					});
				}

				// per-band no-data values are not supported, simply read the no-data from the first occurance if not defined yet
				if (this._nodata.length === 0 && typeof band.nodata !== 'undefined') {
					this._nodata.push(Utils.parseNodata(band.nodata));
				}
			});
		}

		// Load example tiff image
		let tiff;
		if (this.getBlob()) {
			tiff = await tiffFromBlob(this.getBlob());
		}
		else {
			tiff = await tiffFromUrl(this.getUrl());
		}
		this.img = await tiff.getImage();

		// get no-data value from the GeoTIFF if not already defined (needed to exclude it from the stretch)
		let gdalNoData = this.img.getGDALNoData();
		if (this._nodata.length === 0 && gdalNoData !== null) {
			this._nodata.push(gdalNoData);
		}

		// Read (downsampled) raster data to compute a percentile-based stretch (p2 - p98)
		let rasters = null;
		try {
			const maxSize = 1024;
			const width = this.img.getWidth();
			const height = this.img.getHeight();
			const scale = Math.min(1, maxSize / Math.max(width, height));
			rasters = await this.img.readRasters({
				width: Math.max(1, Math.round(width * scale)),
				height: Math.max(1, Math.round(height * scale))
			});
		} catch (error) {
			console.warn(error);
		}

		// Get data for each band / sample
		for (let i = 0; i < this.img.getSamplesPerPixel(); i++) {
			let data = {};

			// Use min/max for data type (as fallback)
			try {
				let dummy = this.img.getArrayForSample(i);
				if (!Number.isFinite(this._bands[i].min)) {
					data.min = this.getMinForDataType(dummy);
				}
				if (!Number.isFinite(this._bands[i].max)) {
					data.max = this.getMaxForDataType(dummy);
				}
			} catch (error) {}

			// Set min/max/name from statistics, if available
			let band = this.img.getGDALMetadata(i);
			if (Utils.isObject(band)) {
				if (GDAL_MIN in band) {
					data.min = parseFloat(band[GDAL_MIN]);
				}
				if (GDAL_MAX in band) {
					data.max = parseFloat(band[GDAL_MAX]);
				}
				if (GDAL_NAME in band) {
					data.name = band[GDAL_NAME];
				}
			}

			// Prefer a percentile-based stretch (p2 - p98) for a better default visualization
			if (rasters && rasters[i]) {
				let percentiles = this.getPercentiles(rasters[i], 2, 98);
				if (percentiles) {
					data.min = percentiles.min;
					data.max = percentiles.max;
				}
			}

			this.setBandInfo(i, data);
		}

		// Get projection from GeoTiff
		let code;
		if (!this.projection && this.img.geoKeys) {
			let { ProjectedCSTypeGeoKey, GeographicTypeGeoKey, ProjLinearUnitsGeoKey, GeogAngularUnitsGeoKey } = this.img.geoKeys;
			if (ProjectedCSTypeGeoKey) {
				code = 'EPSG:' + ProjectedCSTypeGeoKey;
				this.projection = await ProjManager.get(code);
			}
			if (!this.projection && GeographicTypeGeoKey) {
				code = 'EPSG:' + GeographicTypeGeoKey;
				this.projection = await ProjManager.get(code);
			}

			if (!this.projection && code) {
				const units = (ProjLinearUnitsGeoKey && unitsFromCode(ProjLinearUnitsGeoKey)) || (GeogAngularUnitsGeoKey && unitsFromCode(GeogAngularUnitsGeoKey));
				if (units) {
					this.projection = new Projection({ code, units });
				}
			}
		}

		// Get extent from geotiff
		if (!stacHasExtent) {
			try {
				let bbox = this.img.getBoundingBox();
				this.extent = toUserExtent(bbox, this.projection);
			} catch (error) {
				console.warn(error);
			}
		}

		// Store color map as RGB
		if (this.img.fileDirectory.ColorMap) {
			const map = Array.from(this.img.fileDirectory.ColorMap);
			const greenOffset = map.length / 3;
			const blueOffset = map.length / 3 * 2;
			this.colorMap = [];
			for (let i = 0; i < greenOffset; i++) {
				this.colorMap.push([
					Math.trunc(map[i] / 65536 * 256),
					Math.trunc(map[i + greenOffset] / 65536 * 256),
					Math.trunc(map[i + blueOffset] / 65536 * 256),
					this._nodata.includes(i) ? 0 : 1
				]);
			}
		}

		// Get photometric interpretation
		switch (this.img.fileDirectory.PhotometricInterpretation) {
			case _.photometricInterpretations.CMYK:
			case _.photometricInterpretations.YCbCr:
			case _.photometricInterpretations.CIELab:
				this.convertToRGB = true;
				break;
			default:
				// RGB and (Black/White)IsZero are handled via user control
				// Palette is handled directly by our styling
				this.convertToRGB = false;
		}
	}

	setBandInfo(i, data) {
		if (this._bands[i]) {
			Object.assign(this._bands[i], data);
		}
		else {
			this._bands.push(Object.assign({ id: i + 1 }, data));
		}
	}

	getBlob() {
		return this.blob;
	}

	getNoData() {
		return this._nodata;
	}

	getContext() {
		return this.stac;
	}

	getBands() {
		return this._bands;
	}

	getProjection() {
		return this.projection;
	}

	getExtent() {
		return this.extent;
	}

	getColorMap() {
		return this.colorMap;
	}

	getPercentiles(array, lower, upper) {
		// Collect valid values (finite and not no-data)
		let values = [];
		for (let i = 0; i < array.length; i++) {
			let v = array[i];
			if (Number.isFinite(v) && !this._nodata.includes(v)) {
				values.push(v);
			}
		}
		if (values.length === 0) {
			return null;
		}
		values.sort((a, b) => a - b);
		let min = values[Math.floor((lower / 100) * (values.length - 1))];
		let max = values[Math.ceil((upper / 100) * (values.length - 1))];
		if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
			return null;
		}
		return { min, max };
	}

	getMinForDataType(array) {
		if (array instanceof Int8Array) {
			return -128;
		}
		if (array instanceof Int16Array) {
			return -32768;
		}
		if (array instanceof Int32Array) {
			return -2147483648;
		}
		if (array instanceof Float32Array) {
			return 1.2e-38;
		}
		return 0;
	}
	
	getMaxForDataType(array) {
		if (array instanceof Int8Array) {
			return 127;
		}
		if (array instanceof Uint8Array) {
			return 255;
		}
		if (array instanceof Uint8ClampedArray) {
			return 255;
		}
		if (array instanceof Int16Array) {
			return 32767;
		}
		if (array instanceof Uint16Array) {
			return 65535;
		}
		if (array instanceof Int32Array) {
			return 2147483647;
		}
		if (array instanceof Uint32Array) {
			return 4294967295;
		}
		if (array instanceof Float32Array) {
			return 3.4e38;
		}
		return 255;
	}

}

export default GeoTIFF;