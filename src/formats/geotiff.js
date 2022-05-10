import { SupportedFormat } from './format';
import Utils from '../utils';
import ProjManager from '../components/maps/projManager';

import { fromUrl as tiffFromUrl } from 'geotiff';

import { toUserExtent } from 'ol/proj';
import Projection from 'ol/proj/Projection';
import { fromCode as unitsFromCode } from 'ol/proj/Units';

const GDAL_MIN = 'STATISTICS_MINIMUM';
const GDAL_MAX = 'STATISTICS_MAXIMUM';
const GDAL_NAME = 'DESCRIPTION';

class GeoTIFF extends SupportedFormat {

	constructor(asset, stac) {
		super(asset, "MapViewer", 'fa-map', {removableLayers: true});
		this.bands = [];
		this.nodata = undefined;
		this.img = null;
		this.projection = null;
		this.extent = null;
		this.stac = stac;
	}

	isBinary() {
		return true;
	}

	canGroup() {
		return true;
	}

	async getData() {
		await this.parseMetadata();
		return this;
	}

	async parseMetadata() {
		let stacHasExtent = this.stac.geometry || this.stac.extent;

		// Get projection from STAC
		this.projection = await ProjManager.addFromStac(this.stac);

		// Get nodata from STAC file:nodata
		this.nodata = Utils.parseNodata(this['file:nodata']);

		// Get band names from STAC eo:bands
		if (Array.isArray(this['eo:bands']) && this['eo:bands'].length > 0) {
			this['eo:bands'].forEach((band, i) => this.setBandInfo(i, {name: band.name}));
		}

		// Get min/max/nodata from STAC raster:bands
		if (Array.isArray(this['raster:bands']) && this['raster:bands'].length > 0) {
			this['raster:bands'].forEach((band, i) => {
				// Set min/max from statistics
				if (Utils.isObject(band.statistics)) {
					this.setBandInfo(i, {
						min: band.statistics.minimum,
						max: band.statistics.maximum
					});
				}

				// per-band no-data values are not supported, simply read the no-data from the first occurance if not defined yet
				if (typeof this.nodata === 'undefined' && typeof band.nodata !== 'undefined') {
					this.nodata = Utils.parseNodata(band.nodata);
				}
			});
		}

		// If no metadata is present via STAC, try to read it from the GeoTiff itself
		if (this.bands.length === 0 || this.projection === null || !stacHasExtent || this.bands.find(band => typeof band.min === 'undefined' || typeof band.max === 'undefined')) {
			// Load example tiff image
			let tiff = await tiffFromUrl(this.getUrl());
			this.img = await tiff.getImage();

			// Get data for each band / sample
			for(let i = 0; i < this.img.getSamplesPerPixel(); i++) {
				// Set min/max/name from statistics
				let band = this.img.getGDALMetadata(i);
				let data = {};
				if (GDAL_MIN in band) {
					data.min = parseFloat(band[GDAL_MIN]);
				}
				if (GDAL_MAX in band) {
					data.max = parseFloat(band[GDAL_MAX]);
				}
				if (GDAL_NAME in band) {
					data.name = band[GDAL_NAME];
				}
				this.setBandInfo(i, data);

				// get no-data values if needed
				let nodata = this.img.getGDALNoData();
				if (typeof this.nodata === 'undefined' && nodata !== null) {
					this.nodata = nodata;
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
						this.projection = new Projection({code, units});
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
		}
	}

	setBandInfo(i, data) {
		if (this.bands[i]) {
			Object.assign(this.bands[i], data);
		}
		else {
			this.bands.push(Object.assign({id: i+1}, data));
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

}

export default GeoTIFF;