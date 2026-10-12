import Dataset, { VectorData } from '../dataset';
import TableData from '../table';
import { NdDataset, NdVariable, sliceFlat } from '../nd/ndarray';
import { interpretNd } from '../nd/cf';

export function isCovJson(json) {
	return json && typeof json === 'object' && ['Coverage', 'CoverageCollection', 'Domain'].includes(json.type);
}

function axisValues(axis) {
	if (!axis) {
		return null;
	}
	if (Array.isArray(axis.values)) {
		return axis.values;
	}
	if (typeof axis.start === 'number' && typeof axis.num === 'number') {
		const step = axis.num > 1 ? (axis.stop - axis.start) / (axis.num - 1) : 0;
		return Array.from({ length: axis.num }, (_, i) => axis.start + i * step);
	}
	return null;
}

function crsOf(referencing) {
	const ref = (referencing || []).find(r => {
		const coords = r.coordinates || r.components || [];
		return coords.includes('x') || coords.includes('y');
	});
	if (!ref || !ref.system) {
		return 'http://www.opengis.net/def/crs/OGC/1.3/CRS84';
	}
	return ref.system.id || ref.system.wkt || 'http://www.opengis.net/def/crs/OGC/1.3/CRS84';
}

function label(param, key) {
	if (!param) {
		return key;
	}
	const l = param.observedProperty && param.observedProperty.label;
	if (l && typeof l === 'object') {
		return l.en || Object.values(l)[0] || key;
	}
	return l || key;
}

function rangeValues(range, warnings) {
	if (!range || typeof range !== 'object') {
		warnings.push('Ranges that reference external URLs are not supported.');
		return null;
	}
	if (range.type === 'TiledNdArray') {
		warnings.push('Tiled CoverageJSON ranges are not supported.');
		return null;
	}
	return range;
}

async function gridCoverage(cov, parameters, referencing, title, warnings) {
	const axes = cov.domain.axes;
	const coordVars = [];
	for (const name of ['x', 'y', 't', 'z']) {
		const values = axisValues(axes[name]);
		if (values) {
			coordVars.push(new NdVariable({
				name, dims: [name], shape: [values.length], attrs: name === 't' ? { axis: 'T' } : {},
				reader: async sel => sliceFlat(values, [values.length], sel)
			}));
		}
	}
	const dataVars = [];
	for (const [key, raw] of Object.entries(cov.ranges || {})) {
		const range = rangeValues(raw, warnings);
		if (!range) {
			continue;
		}
		const values = Float64Array.from(range.values, v => v === null ? NaN : v);
		const dims = range.axisNames || [];
		const shape = range.shape || dims.map(d => axisValues(axes[d]).length);
		dataVars.push(new NdVariable({
			name: label(parameters[key], key), dims, shape, dtype: 'float64', attrs: { units: parameters[key] && parameters[key].unit ? parameters[key].unit.symbol : undefined },
			reader: async sel => sliceFlat(values, shape, sel)
		}));
	}
	const nd = new NdDataset({ attrs: { crs: crsOf(cov.domain.referencing || referencing) }, variables: [...coordVars, ...dataVars], format: 'CoverageJSON' });
	return interpretNd(nd, title);
}

function pointGeometry(axes) {
	const x = axisValues(axes.x);
	const y = axisValues(axes.y);
	if (x && y) {
		return x.length === 1 && y.length === 1 ? { type: 'Point', coordinates: [x[0], y[0]] } : { type: 'MultiPoint', coordinates: x.map((v, i) => [v, y[i] ?? y[0]]) };
	}
	const composite = axes.composite;
	if (composite && Array.isArray(composite.values)) {
		const dt = composite.dataType;
		if (dt === 'polygon') {
			return composite.values.length === 1 ? { type: 'Polygon', coordinates: composite.values[0] } : { type: 'MultiPolygon', coordinates: composite.values };
		}
		if (dt === 'tuple' && composite.values.length) {
			const coords = composite.values.map(v => (composite.coordinates || ['x', 'y']).length >= 3 ? [v[1], v[2]] : v);
			return { type: 'LineString', coordinates: coords };
		}
	}
	return null;
}

// Non-grid coverages (Point, PointSeries, Polygon, ...) become features plus a long table
function featureCoverages(coverages, parameters) {
	const features = [];
	const rows = [];
	coverages.forEach((cov, index) => {
		const axes = (cov.domain && cov.domain.axes) || {};
		const times = axisValues(axes.t) || [null];
		const props = { coverage: index };
		for (const [key, range] of Object.entries(cov.ranges || {})) {
			if (!range || !Array.isArray(range.values)) {
				continue;
			}
			const name = label(parameters[key], key);
			const values = range.values;
			props[name] = values[values.length - 1];
			const ti = (range.axisNames || []).indexOf('t');
			values.forEach((v, i) => {
				const time = ti >= 0 ? times[i] : times[0];
				let row = rows.find(r => r.coverage === index && r.time === time);
				if (!row) {
					row = { coverage: index, time };
					rows.push(row);
				}
				row[name] = v;
			});
		}
		features.push({ type: 'Feature', geometry: pointGeometry(axes), properties: props });
	});
	const hasTime = rows.some(r => r.time !== null);
	return {
		features: features.filter(f => f.geometry),
		table: TableData.fromObjects(rows.map(r => {
			const o = { ...r };
			if (!hasTime) {
				delete o.time;
			}
			return o;
		}))
	};
}

export async function readCovJson(json, name) {
	const ds = new Dataset(name, 'CoverageJSON');
	const parameters = json.parameters || {};
	const coverages = json.type === 'CoverageCollection' ? json.coverages || [] : [json];
	const domainType = c => (c.domain && c.domain.domainType) || json.domainType;
	const grids = coverages.filter(c => domainType(c) === 'Grid');
	const others = coverages.filter(c => domainType(c) !== 'Grid');
	for (const cov of grids) {
		const params = Object.assign({}, parameters, cov.parameters);
		const { sources, table } = await gridCoverage(cov, params, json.referencing, name, ds.warnings);
		ds.rasters.push(...sources);
		ds.addTable(table, name);
	}
	if (others.length > 0) {
		const params = Object.assign({}, parameters, ...others.map(c => c.parameters || {}));
		const { features, table } = featureCoverages(others, params);
		if (features.length > 0) {
			const crs = crsOf((others[0].domain && others[0].domain.referencing) || json.referencing);
			ds.vectors.push(await VectorData.create(name, { type: 'FeatureCollection', features }, crs));
		}
		ds.addTable(table, name);
	}
	ds.info = { type: json.type, domainType: json.domainType || (coverages[0] && domainType(coverages[0])), parameters };
	return ds;
}
