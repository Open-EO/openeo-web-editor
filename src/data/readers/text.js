import Dataset, { VectorData } from '../dataset';
import TableData from '../table';
import Utils from '../../utils';
import { looksLikeDate } from '../time';
import { isCovJson, readCovJson } from './covjson';

// From https://stackoverflow.com/questions/1293147/example-javascript-code-to-parse-csv-data
export function parseCsv(str, delims = [',', ';']) {
	const arr = [];
	let quote = false;
	for (let row = 0, col = 0, c = 0; c < str.length; c++) {
		const cc = str[c], nc = str[c + 1];
		arr[row] = arr[row] || [];
		arr[row][col] = arr[row][col] || '';
		if (cc === '"' && quote && nc === '"') {
			arr[row][col] += cc;
			++c;
			continue;
		}
		if (cc === '"') {
			quote = !quote;
			continue;
		}
		if (delims.includes(cc) && !quote) {
			++col;
			continue;
		}
		if (cc === '\r' && nc === '\n' && !quote) {
			++row; col = 0; ++c;
			continue;
		}
		if ((cc === '\n' || cc === '\r') && !quote) {
			++row; col = 0;
			continue;
		}
		arr[row][col] += cc;
	}
	return arr;
}

function parseValue(v) {
	const s = String(v).trim();
	if (s.length === 0) {
		return null;
	}
	if (!isNaN(s)) {
		return parseFloat(s);
	}
	return s;
}

const LON = /^(lon|long|longitude|x)$/i;
const LAT = /^(lat|latitude|y)$/i;

async function pointsFromTable(table, name) {
	const lon = table.columns.find(c => LON.test(c));
	const lat = table.columns.find(c => LAT.test(c));
	if (!lon || !lat) {
		return null;
	}
	const li = table.columns.indexOf(lon), ti = table.columns.indexOf(lat);
	const valid = table.rows.filter(r => typeof r[li] === 'number' && typeof r[ti] === 'number');
	if (valid.length === 0 || valid.some(r => Math.abs(r[li]) > 180 || Math.abs(r[ti]) > 90)) {
		return null;
	}
	const features = valid.map(r => ({
		type: 'Feature',
		geometry: { type: 'Point', coordinates: [r[li], r[ti]] },
		properties: Object.fromEntries(table.columns.map((c, i) => [c, r[i]]))
	}));
	return VectorData.create(name, { type: 'FeatureCollection', features });
}

export async function readCsv(input, delims = [',', ';']) {
	const text = (await input.text()).trim();
	const rows = parseCsv(text, delims).filter(r => r.length > 1 || (r[0] && r[0].trim() !== ''));
	const ds = new Dataset(input.name, delims.includes('\t') ? 'TSV' : 'CSV');
	if (rows.length === 0) {
		ds.raw = text;
		return ds;
	}
	const header = rows[0].map(h => String(h).trim());
	const headerIsData = header.every(h => !isNaN(h) && h !== '');
	const columns = headerIsData ? header.map((_, i) => `column ${i + 1}`) : header;
	const table = new TableData(columns, (headerIsData ? rows : rows.slice(1)).map(r => columns.map((_, i) => parseValue(r[i] ?? ''))));
	ds.addTable(table, input.name);
	const points = await pointsFromTable(table, input.name);
	if (points) {
		ds.vectors.push(points);
	}
	return ds;
}

// openEO JSON time series, e.g. aggregate_spatial results: { "2020-01-01T00:00:00Z": [[b1, b2], ...], ... }
function timeseriesFromJson(json) {
	if (!Utils.isObject(json)) {
		return null;
	}
	const keys = Object.keys(json);
	if (keys.length === 0 || !keys.every(looksLikeDate)) {
		return null;
	}
	const rows = [];
	for (const date of keys.sort()) {
		const value = json[date];
		const features = Array.isArray(value) ? value : [value];
		features.forEach((bands, feature) => {
			const values = Array.isArray(bands) ? bands : [bands];
			const row = { date, feature_index: feature };
			values.forEach((v, i) => row[`band ${i}`] = typeof v === 'number' ? v : null);
			rows.push(row);
		});
	}
	return TableData.fromObjects(rows);
}

function tableFromJson(json) {
	if (Array.isArray(json) && json.length > 0 && json.every(r => Utils.isObject(r))) {
		return TableData.fromObjects(json);
	}
	if (Utils.isObject(json)) {
		const values = Object.values(json);
		if (values.length > 0 && values.every(r => Utils.isObject(r))) {
			const keys = Object.keys(values[0]);
			if (values.every(r => Utils.equals(Object.keys(r), keys))) {
				return TableData.fromObjects(Object.entries(json).map(([k, r]) => ({ key: k, ...r })));
			}
		}
	}
	return null;
}

export async function readJson(input, json = null) {
	if (json === null) {
		const text = await input.text();
		try {
			json = JSON.parse(text);
		} catch (error) {
			const ds = new Dataset(input.name, 'Text');
			ds.raw = text;
			return ds;
		}
	}
	if (isCovJson(json)) {
		return readCovJson(json, input.name);
	}
	const ds = new Dataset(input.name, 'JSON');
	ds.raw = json;
	if (Utils.detectGeoJson(json)) {
		ds.format = 'GeoJSON';
		ds.vectors.push(await VectorData.create(input.name, json));
		return ds;
	}
	const ts = timeseriesFromJson(json);
	if (ts) {
		ds.addTable(ts, input.name);
		return ds;
	}
	const table = tableFromJson(json);
	if (table) {
		ds.addTable(table, input.name);
	}
	return ds;
}
