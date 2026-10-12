import { geoJsonBbox, reprojectGeoJson, resolveCrs, WGS84 } from './crs';
import TableData from './table';

export class VectorData {

	// geojson is in WGS 84 after creation via VectorData.create
	constructor(title, geojson, sourceCrs = WGS84) {
		this.title = title;
		this.geojson = geojson;
		this.sourceCrs = sourceCrs;
		this.bbox = geoJsonBbox(geojson);
	}

	static async create(title, geojson, crs = null) {
		const fc = toFeatureCollection(geojson);
		const legacy = fc.crs && fc.crs.properties && fc.crs.properties.name;
		const resolved = await resolveCrs(crs || legacy || WGS84);
		if (crs && !resolved) {
			throw new Error(`Unsupported coordinate reference system: ${typeof crs === 'string' ? crs : JSON.stringify(crs).slice(0, 100)}`);
		}
		const reprojected = reprojectGeoJson(fc, resolved || WGS84, WGS84);
		return new VectorData(title, reprojected, resolved || WGS84);
	}

	get features() {
		return this.geojson.features;
	}

	toTable() {
		return TableData.fromObjects(this.features.map(f => f.properties || {}));
	}

	numericProperties() {
		return this.toTable().numericColumns();
	}

}

function toFeatureCollection(geojson) {
	if (geojson.type === 'FeatureCollection') {
		return geojson;
	}
	if (geojson.type === 'Feature') {
		return { type: 'FeatureCollection', features: [geojson] };
	}
	if (Array.isArray(geojson)) {
		return { type: 'FeatureCollection', features: geojson };
	}
	return { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: geojson, properties: {} }] };
}

// Everything a single file decodes into; the preview pane decides how to show it
export default class Dataset {

	constructor(title = null, format = null) {
		this.title = title;
		this.format = format;
		this.rasters = [];
		this.vectors = [];
		this.tables = [];
		this.charts = [];
		this.raw = undefined;
		this.info = null;
		this.warnings = [];
		this.disposers = [];
	}

	get hasMap() {
		return this.rasters.some(r => r.isGeoreferenced()) || this.vectors.length > 0;
	}

	get hasUngeoreferencedRaster() {
		return this.rasters.some(r => !r.isGeoreferenced());
	}

	addTable(table, title = null) {
		if (!table) {
			return;
		}
		table.title = title;
		this.tables.push(table);
		const chart = table.toChart();
		if (chart) {
			chart.title = title;
			this.charts.push(chart);
		}
	}

	merge(other) {
		this.rasters.push(...other.rasters);
		this.vectors.push(...other.vectors);
		this.tables.push(...other.tables);
		this.charts.push(...other.charts);
		this.warnings.push(...other.warnings);
		this.disposers.push(...other.disposers);
		if (other.info) {
			this.info = Object.assign(this.info || {}, { [other.title || 'file']: other.info });
		}
	}

	destroy() {
		this.rasters.forEach(r => r.destroy());
		this.disposers.forEach(fn => fn());
	}

}
