import NdRasterSource from '../sources/ndRasterSource';
import { resolveCrs, WGS84 } from '../crs';
import { decodeCfTimes, isCfTimeUnits } from '../time';
import { toPlainArray } from './ndarray';
import TableData from '../table';

const X_NAMES = /^(x|lon|long|longitude|easting|rlon|xc|x_coord)$/i;
const Y_NAMES = /^(y|lat|latitude|northing|rlat|yc|y_coord)$/i;
const T_NAMES = /^(t|time|times|date|dates|datetime)$/i;
const BAND_NAMES = /^(bands?|band_name|variable|variables|wavelength|spectral)$/i;
const MAX_BANDS = 64;

function baseName(name) {
	return name.split('/').pop();
}

function coordinateVariable(ds, dim) {
	return ds.variables.find(v => v.dims.length === 1 && v.dims[0] === dim) || null;
}

function classifyDim(dim, coord) {
	const name = baseName(dim);
	const a = coord ? coord.attrs : {};
	const sn = String(a.standard_name || '').toLowerCase();
	const units = String(a.units || '').toLowerCase();
	const axis = String(a.axis || '').toUpperCase();
	if (axis === 'X' || ['projection_x_coordinate', 'longitude', 'grid_longitude'].includes(sn) || /^degrees?_?e(ast)?$/.test(units) || X_NAMES.test(name)) {
		return 'x';
	}
	if (axis === 'Y' || ['projection_y_coordinate', 'latitude', 'grid_latitude'].includes(sn) || /^degrees?_?n(orth)?$/.test(units) || Y_NAMES.test(name)) {
		return 'y';
	}
	if (axis === 'T' || sn === 'time' || isCfTimeUnits(units) || T_NAMES.test(name)) {
		return 't';
	}
	if (BAND_NAMES.test(name)) {
		return 'bands';
	}
	return null;
}

export function variableDecoding(variable) {
	const a = variable.attrs;
	const nodata = [a._FillValue, a.missing_value, a.nodata, a.NoData].flat().filter(v => typeof v === 'number' || typeof v === 'string');
	return {
		nodata: nodata.map(v => (typeof v === 'string' && v.toLowerCase() === 'nan') ? NaN : Number(v)),
		scale: typeof a.scale_factor === 'number' ? a.scale_factor : 1,
		offset: typeof a.add_offset === 'number' ? a.add_offset : 0
	};
}

async function coordinateValues(ds, dim, size) {
	const cv = coordinateVariable(ds, dim);
	if (!cv) {
		return { values: Array.from({ length: size }, (_, i) => i), coord: null };
	}
	let values = await cv.values();
	if (typeof values[0] === 'string' && values.length === 1 && size > 1) {
		values = values[0].split('');
	}
	return { values, coord: cv };
}

async function decodeTimes(ds, dim, size) {
	const { values, coord } = await coordinateValues(ds, dim, size);
	const units = coord && coord.attrs.units;
	if (isCfTimeUnits(units)) {
		return decodeCfTimes(values, units);
	}
	if (typeof values[0] === 'string') {
		return values;
	}
	return values.map(v => String(v));
}

async function findCrs(ds, variable, xKind) {
	const candidates = [];
	let gm = variable.attrs.grid_mapping;
	if (typeof gm === 'string') {
		// Extended form "crs: x y"
		gm = gm.split(':')[0].trim();
		const gmVar = ds.variables.find(v => baseName(v.name) === gm || v.name === gm);
		if (gmVar) {
			const a = gmVar.attrs;
			candidates.push(a.crs_wkt, a.spatial_ref, a.esri_pe_string, a.proj4, a.proj4text, a.proj4_params, a.epsg_code, a.EPSG);
			if (a.grid_mapping_name === 'latitude_longitude') {
				candidates.push(WGS84);
			}
		}
	}
	for (const v of ds.variables.filter(v => /^(crs|spatial_ref)$/i.test(baseName(v.name)))) {
		candidates.push(v.attrs.crs_wkt, v.attrs.spatial_ref);
	}
	const g = ds.attrs;
	candidates.push(g.crs, g.crs_wkt, g.spatial_ref, g['proj:code'], g['proj:epsg'], g['proj:wkt2'], g.EPSG);
	for (const c of candidates) {
		if (c !== null && typeof c !== 'undefined' && c !== '') {
			const crs = await resolveCrs(c);
			if (crs) {
				return crs;
			}
		}
	}
	return xKind === 'geographic' ? WGS84 : null;
}

function gridBounds(values) {
	const n = values.length;
	const first = Number(values[0]);
	const last = Number(values[n - 1]);
	const res = n > 1 ? (last - first) / (n - 1) : 1;
	const min = Math.min(first, last) - Math.abs(res) / 2;
	const max = Math.max(first, last) + Math.abs(res) / 2;
	return { min, max, ascending: res > 0 };
}

function isNumericDtype(variable) {
	// dtype notations: h5wasm "<h", zarrita "int16", netcdfjs "short"
	const d = String(variable.dtype || '').toLowerCase();
	if (!d) {
		return true;
	}
	return /^(u?int\d*|float\d*|short|ushort|byte|ubyte|double|[<>|=]?[iuf]\d+|[<>|=][hilqfdb])$/.test(d);
}

// Turns an n-dimensional dataset into raster sources based on the CF conventions,
// with fallbacks for common openEO back-end outputs.
export async function interpretNd(ds, title = null) {
	const sizes = {};
	ds.variables.forEach(v => v.dims.forEach((d, i) => sizes[d] = v.shape[i]));
	const kinds = {};
	Object.keys(sizes).forEach(d => kinds[d] = classifyDim(d, coordinateVariable(ds, d)));

	const isCoord = v => v.dims.length === 1 && v.dims[0] === v.name;
	const dataVars = ds.variables.filter(v => !isCoord(v) && v.dims.length >= 2 && isNumericDtype(v));
	const rasterVars = dataVars.filter(v => v.dims.some(d => kinds[d] === 'x') && v.dims.some(d => kinds[d] === 'y'));

	const groups = new Map();
	for (const v of rasterVars) {
		const key = v.dims.join('|') + '|' + (v.attrs.grid_mapping || '');
		if (!groups.has(key)) {
			groups.set(key, []);
		}
		groups.get(key).push(v);
	}

	const sources = [];
	for (const vars of groups.values()) {
		const ref = vars[0];
		const xDim = ref.dims.find(d => kinds[d] === 'x');
		const yDim = ref.dims.find(d => kinds[d] === 'y');
		const timeDim = ref.dims.find(d => kinds[d] === 't') || null;
		const bandDim = ref.dims.find(d => kinds[d] === 'bands') || null;
		const xs = await coordinateValues(ds, xDim, sizes[xDim]);
		const ys = await coordinateValues(ds, yDim, sizes[yDim]);
		const xb = gridBounds(xs.values);
		const yb = gridBounds(ys.values);
		const xUnits = String((xs.coord && xs.coord.attrs.units) || '').toLowerCase();
		const geographic = /^degrees?/.test(xUnits) || /^(lon|long|longitude)$/i.test(baseName(xDim));
		let crs = (xs.coord && ys.coord) ? await findCrs(ds, ref, geographic ? 'geographic' : 'projected') : null;

		let bandLabels = null;
		if (bandDim) {
			bandLabels = (await coordinateValues(ds, bandDim, sizes[bandDim])).values.map(String);
		}
		const variables = [];
		const bands = [];
		for (const v of vars) {
			const n = bandDim ? sizes[bandDim] : 1;
			for (let i = 0; i < n && variables.length < MAX_BANDS; i++) {
				variables.push({ variable: v, bandIndex: bandDim ? i : null });
				const name = baseName(v.name);
				const label = bandDim ? (vars.length > 1 ? `${name}:${bandLabels[i]}` : bandLabels[i]) : name;
				bands.push({ name: label, unit: v.attrs.units || null, description: v.attrs.long_name || v.attrs.description || null });
			}
		}

		const times = timeDim ? await decodeTimes(ds, timeDim, sizes[timeDim]) : null;
		const extraDims = [];
		for (const d of ref.dims) {
			if (![xDim, yDim, timeDim, bandDim].includes(d)) {
				const { values } = await coordinateValues(ds, d, sizes[d]);
				extraDims.push({ name: d, values: values.map(String) });
			}
		}

		sources.push(new NdRasterSource({
			title: vars.length === 1 ? baseName(ref.name) : title,
			crs,
			bbox: crs ? [xb.min, yb.min, xb.max, yb.max] : [0, 0, sizes[xDim], sizes[yDim]],
			width: sizes[xDim],
			height: sizes[yDim],
			bands,
			times,
			extraDims,
			attrs: ref.attrs
		}, {
			variables,
			xDim,
			yDim,
			timeDim,
			bandDim,
			yAscending: crs ? yb.ascending : false,
			decode: variableDecoding
		}));
	}

	let table = null;
	if (sources.length === 0) {
		table = await ndToTable(ds, sizes, kinds);
	}
	return { sources, table };
}

// Long-format table for non-gridded data, e.g. vector cubes with (geometry, time) dimensions
async function ndToTable(ds, sizes, kinds, maxRows = 200000) {
	const isCoord = v => v.dims.length === 1 && v.dims[0] === v.name;
	const vars = ds.variables.filter(v => !isCoord(v) && v.dims.length >= 1 && v.dims.length <= 3 && isNumericDtype(v));
	if (vars.length === 0) {
		return null;
	}
	const groups = new Map();
	vars.forEach(v => {
		const key = v.dims.join('|');
		groups.set(key, (groups.get(key) || []).concat([v]));
	});
	// Use the group with the most variables
	const group = Array.from(groups.values()).sort((a, b) => b.length - a.length)[0];
	const dims = group[0].dims;
	const total = dims.reduce((a, d) => a * sizes[d], 1);
	if (total > maxRows) {
		return null;
	}
	const dimValues = await Promise.all(dims.map(async d => kinds[d] === 't' ? await decodeTimes(ds, d, sizes[d]) : (await coordinateValues(ds, d, sizes[d])).values));
	const data = await Promise.all(group.map(async v => {
		const d = variableDecoding(v);
		const vals = toPlainArray((await v.read(null)).data);
		return vals.map(x => {
			const n = Number(x);
			return (d.nodata.includes(n) || Number.isNaN(n)) ? null : n * d.scale + d.offset;
		});
	}));
	const columns = [...dims.map(baseName), ...group.map(v => baseName(v.name))];
	const rows = [];
	for (let i = 0; i < total; i++) {
		let rest = i;
		const idx = [];
		for (let k = dims.length - 1; k >= 0; k--) {
			idx[k] = rest % sizes[dims[k]];
			rest = Math.floor(rest / sizes[dims[k]]);
		}
		rows.push([...idx.map((j, k) => dimValues[k][j]), ...data.map(col => col[i])]);
	}
	return new TableData(columns, rows);
}

export function describeNd(ds) {
	return {
		format: ds.format,
		attributes: ds.attrs,
		variables: Object.fromEntries(ds.variables.map(v => [v.name, {
			dimensions: v.dims.map((d, i) => `${baseName(d)} (${v.shape[i]})`).join(', ') || 'scalar',
			dtype: v.dtype,
			attributes: v.attrs
		}]))
	};
}
