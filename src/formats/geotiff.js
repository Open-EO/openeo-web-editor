import { SupportedFormat } from './format';
import Utils from '../utils';
import ProjManager from '../components/maps/projManager';

import { fromUrl as tiffFromUrl, globals as _ } from 'geotiff';

import { toUserExtent } from 'ol/proj';
import Projection from 'ol/proj/Projection';
import { fromCode as unitsFromCode } from 'ol/proj/Units';

const GDAL_MIN = 'STATISTICS_MINIMUM';
const GDAL_MAX = 'STATISTICS_MAXIMUM';
const GDAL_NAME = 'DESCRIPTION';

class GeoTIFF extends SupportedFormat {

	constructor(asset, stac) {
		super(asset, "MapViewer", 'fa-map', { removableLayers: true });
		this.bands = [];
		this.nodata = [];
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
			this.nodata = Utils.parseNodata(this['file:nodata']);
		}

		// Get band names from STAC eo:bands
		if (Array.isArray(this['eo:bands']) && this['eo:bands'].length > 0) {
			this['eo:bands'].forEach((band, i) => this.setBandInfo(i, { name: band.name }));
		}

		// Get min/max/nodata from STAC raster:bands
		if (Array.isArray(this['raster:bands']) && this['raster:bands'].length > 0) {
			this['raster:bands'].forEach((band, i) => {
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
				if (this.nodata.length === 0 && typeof band.nodata !== 'undefined') {
					this.nodata.push(Utils.parseNodata(band.nodata));
				}
			});
		}

		// Load example tiff image
		let tiff = await tiffFromUrl(this.getUrl());
		this.img = await tiff.getImage();

		// Get data for each band / sample
		for (let i = 0; i < this.img.getSamplesPerPixel(); i++) {
			let data = {};

			// Use min/max for data type (as fallback)
			try {
				let dummy = this.img.getArrayForSample(i);
				if (!Number.isFinite(this.bands[i].min)) {
					data.min = this.getMinForDataType(dummy);
				}
				if (!Number.isFinite(this.bands[i].max)) {
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

			this.setBandInfo(i, data);

			// get no-data values if needed
			let nodata = this.img.getGDALNoData();
			if (this.nodata.length === 0 && nodata !== null) {
				this.nodata.push(nodata);
			}
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
					this.nodata.includes(i) ? 0 : 1
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
		if (this.bands[i]) {
			Object.assign(this.bands[i], data);
		}
		else {
			this.bands.push(Object.assign({ id: i + 1 }, data));
		}
	}

	getNoData() {
		return this.nodata;
	}

	getContext() {
		return this.stac;
	}

	getBands() {
		return this.bands;
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