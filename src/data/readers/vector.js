import Dataset, { VectorData } from '../dataset';
import { resolveCrs } from '../crs';
import { parseGpkgGeometry } from '../wkb';

export async function readFlatGeobuf(input) {
	const { deserialize } = await import('flatgeobuf/lib/mjs/geojson.js');
	const bytes = new Uint8Array(await input.arrayBuffer());
	let header = null;
	const features = [];
	for await (const feature of deserialize(bytes, undefined, h => header = h)) {
		features.push(feature);
	}
	let crs = null;
	if (header && header.crs) {
		const c = header.crs;
		crs = c.wkt || (c.code ? `${c.org || 'EPSG'}:${c.code}` : null);
	}
	const ds = new Dataset(input.name, 'FlatGeobuf');
	ds.vectors.push(await VectorData.create(header && header.title || input.name, { type: 'FeatureCollection', features }, crs));
	ds.info = { header: header ? { title: header.title, description: header.description, featuresCount: Number(header.featuresCount), crs: header.crs } : null };
	return ds;
}

let sqlPromise = null;
async function getSql() {
	if (!sqlPromise) {
		sqlPromise = (async () => {
			const { default: initSqlJs } = await import('sql.js/dist/sql-wasm-browser.js');
			const { default: wasmUrl } = await import('sql.js/dist/sql-wasm-browser.wasm');
			return await initSqlJs({ locateFile: () => wasmUrl });
		})();
	}
	return sqlPromise;
}

export async function readGeoPackage(input) {
	const SQL = await getSql();
	const db = new SQL.Database(new Uint8Array(await input.arrayBuffer()));
	const query = (sql, params = []) => {
		const stmt = db.prepare(sql);
		stmt.bind(params);
		const rows = [];
		while (stmt.step()) {
			rows.push(stmt.getAsObject());
		}
		stmt.free();
		return rows;
	};
	const ds = new Dataset(input.name, 'GeoPackage');
	try {
		const layers = query(`SELECT c.table_name, c.data_type, c.identifier, g.column_name, s.organization, s.organization_coordsys_id, s.definition
			FROM gpkg_contents c
			LEFT JOIN gpkg_geometry_columns g ON g.table_name = c.table_name
			LEFT JOIN gpkg_spatial_ref_sys s ON s.srs_id = c.srs_id`);
		for (const layer of layers) {
			const table = layer.table_name.replace(/"/g, '""');
			if (layer.data_type === 'features' && layer.column_name) {
				let crs = null;
				if (layer.organization && layer.organization.toUpperCase() === 'EPSG' && layer.organization_coordsys_id > 0) {
					crs = `EPSG:${layer.organization_coordsys_id}`;
				}
				else if (layer.definition && layer.definition !== 'undefined') {
					crs = layer.definition;
				}
				const features = query(`SELECT * FROM "${table}"`).map(row => {
					const geometry = parseGpkgGeometry(row[layer.column_name]);
					const properties = { ...row };
					delete properties[layer.column_name];
					return { type: 'Feature', geometry, properties };
				});
				ds.vectors.push(await VectorData.create(layer.identifier || layer.table_name, { type: 'FeatureCollection', features }, await resolveCrs(crs)));
			}
			else if (layer.data_type === 'attributes') {
				const rows = query(`SELECT * FROM "${table}" LIMIT 100000`);
				const { default: TableData } = await import('../table');
				ds.addTable(TableData.fromObjects(rows), layer.identifier || layer.table_name);
			}
			else {
				ds.warnings.push(`GeoPackage layer "${layer.table_name}" of type "${layer.data_type}" is not supported.`);
			}
		}
		ds.info = { layers: layers.map(l => ({ name: l.table_name, type: l.data_type, srs: l.organization ? `${l.organization}:${l.organization_coordsys_id}` : null })) };
	} finally {
		db.close();
	}
	return ds;
}

export async function readShapefileZip(input, buffer = null) {
	const { default: shp } = await import('shpjs');
	let result = await shp(buffer || await input.arrayBuffer());
	if (!Array.isArray(result)) {
		result = [result];
	}
	const ds = new Dataset(input.name, 'Shapefile');
	for (const fc of result) {
		// shpjs already reprojects to WGS 84 based on the .prj file
		ds.vectors.push(await VectorData.create(fc.fileName || input.name, fc));
	}
	return ds;
}

export async function readXmlVector(input, kind, text = null) {
	const togeojson = await import('@tmcw/togeojson');
	const xml = new DOMParser().parseFromString(text || await input.text(), 'text/xml');
	const fc = kind === 'gpx' ? togeojson.gpx(xml) : togeojson.kml(xml);
	const ds = new Dataset(input.name, kind.toUpperCase());
	ds.vectors.push(await VectorData.create(input.name, fc));
	return ds;
}

export async function readKmz(input) {
	const { unzip } = await import('unzipit');
	const { entries } = await unzip(await input.getBlob());
	const name = Object.keys(entries).find(n => n.toLowerCase().endsWith('.kml'));
	if (!name) {
		throw new Error('No KML file found in KMZ archive');
	}
	return readXmlVector(input, 'kml', await entries[name].text());
}
