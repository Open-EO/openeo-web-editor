import Dataset, { VectorData } from '../dataset';
import TableData from '../table';
import { parseWkb } from '../wkb';

const MAX_ROWS = 500000;

function asyncBufferFromBlob(blob) {
	return {
		byteLength: blob.size,
		slice: (start, end) => blob.slice(start, end).arrayBuffer()
	};
}

// (Geo)Parquet via hyparquet. GeoParquet WKB columns are decoded to GeoJSON by hyparquet.
export async function readParquet(input) {
	const { parquetMetadataAsync, parquetReadObjects, parquetSchema, asyncBufferFromUrl } = await import('hyparquet');
	const { compressors } = await import('hyparquet-compressors');
	let file;
	if (input.blob || input._download) {
		file = asyncBufferFromBlob(await input.getBlob());
	}
	else {
		file = await asyncBufferFromUrl({ url: input.url, requestInit: { headers: input.headers } });
	}
	const metadata = await parquetMetadataAsync(file);
	const kv = Object.fromEntries((metadata.key_value_metadata || []).map(e => [e.key, e.value]));
	let geo = null;
	try {
		geo = kv.geo ? JSON.parse(kv.geo) : null;
	} catch (e) {
		geo = null;
	}
	const numRows = Number(metadata.num_rows);
	const ds = new Dataset(input.name, geo ? 'GeoParquet' : 'Parquet');
	if (numRows > MAX_ROWS) {
		ds.warnings.push(`Only the first ${MAX_ROWS.toLocaleString()} of ${numRows.toLocaleString()} rows are shown.`);
	}
	const rows = await parquetReadObjects({ file, metadata, compressors, rowEnd: Math.min(numRows, MAX_ROWS) });
	const schema = parquetSchema(metadata);
	const columns = schema.children.map(c => c.element.name);

	const geomCols = geo && geo.columns ? Object.keys(geo.columns) : [];
	if (!geo && columns.includes('geometry') && rows.length && rows[0].geometry instanceof Uint8Array) {
		geomCols.push('geometry');
	}
	const primary = geo && geo.primary_column && geomCols.includes(geo.primary_column) ? geo.primary_column : geomCols[0];
	const attributeColumns = columns.filter(c => !geomCols.includes(c));

	if (primary) {
		const features = rows.map(row => {
			let geometry = row[primary];
			if (geometry instanceof Uint8Array) {
				geometry = parseWkb(geometry);
			}
			const properties = {};
			attributeColumns.forEach(c => properties[c] = typeof row[c] === 'bigint' ? Number(row[c]) : row[c]);
			return { type: 'Feature', geometry: geometry || null, properties };
		});
		// A missing crs means OGC:CRS84 in GeoParquet, while null means undefined
		const colMeta = geo && geo.columns ? geo.columns[primary] : null;
		const crs = colMeta && typeof colMeta.crs !== 'undefined' ? colMeta.crs : null;
		ds.vectors.push(await VectorData.create(input.name, { type: 'FeatureCollection', features }, crs));
	}
	const table = TableData.fromObjects(rows.map(r => {
		const o = {};
		attributeColumns.forEach(c => o[c] = r[c]);
		return o;
	}), attributeColumns);
	ds.addTable(table, primary ? 'Attributes' : input.name);
	ds.info = {
		rows: numRows,
		columns: schema.children.map(c => ({ name: c.element.name, type: c.element.logical_type ? c.element.logical_type.type : c.element.type })),
		metadata: Object.fromEntries(Object.entries(kv).filter(([k]) => k !== 'ARROW:schema').map(([k, v]) => [k, safeJson(v)]))
	};
	return ds;
}

function safeJson(v) {
	try {
		return JSON.parse(v);
	} catch (e) {
		return v;
	}
}
