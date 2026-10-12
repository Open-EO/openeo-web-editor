import Dataset from '../dataset';
import DataInput from '../input';
import GeoTiffSource from '../sources/geotiffSource';
import { interpretNd, describeNd } from '../nd/cf';
import { isHdf5, openHdf5 } from '../nd/hdf5';
import { isNetCdf3, openNetCdf3 } from '../nd/netcdf3';
import { BlobMapStore, openZarr, openZarrFromUrl, openZarrFromZip } from '../nd/zarr';
import { readCovJson } from './covjson';
import { readParquet } from './parquet';
import { readCsv, readJson } from './text';
import { readFlatGeobuf, readGeoPackage, readKmz, readShapefileZip, readXmlVector } from './vector';

const MIME = {
	'image/tiff': 'geotiff',
	'image/tiff; application=geotiff': 'geotiff',
	'application/x-geotiff': 'geotiff',
	'application/netcdf': 'netcdf',
	'application/x-netcdf': 'netcdf',
	'application/x-netcdf4': 'netcdf',
	'application/x-hdf5': 'netcdf',
	'application/x-hdf': 'netcdf',
	'application/vnd+zarr': 'zarr',
	'application/vnd.zarr': 'zarr',
	'application/x-zarr': 'zarr',
	'application/vnd.apache.parquet': 'parquet',
	'application/x-parquet': 'parquet',
	'application/parquet': 'parquet',
	'application/vnd.flatgeobuf': 'flatgeobuf',
	'application/flatgeobuf': 'flatgeobuf',
	'application/geopackage+sqlite3': 'gpkg',
	'application/x-sqlite3': 'gpkg',
	'application/prs.coverage+json': 'covjson',
	'application/geo+json': 'json',
	'application/json': 'json',
	'text/json': 'json',
	'text/csv': 'csv',
	'text/tab-separated-values': 'tsv',
	'application/vnd.google-earth.kml+xml': 'kml',
	'application/vnd.google-earth.kmz': 'kmz',
	'application/gpx+xml': 'gpx',
	'application/zip': 'zip',
	'application/x-zip-compressed': 'zip'
};

const EXT = {
	tif: 'geotiff', tiff: 'geotiff', gtiff: 'geotiff', cog: 'geotiff',
	nc: 'netcdf', nc4: 'netcdf', netcdf: 'netcdf', cdf: 'netcdf', h5: 'netcdf', hdf5: 'netcdf', he5: 'netcdf', hdf: 'netcdf',
	zarr: 'zarr', 'zarr.zip': 'zarr-zip',
	parquet: 'parquet', geoparquet: 'parquet', pq: 'parquet',
	fgb: 'flatgeobuf', flatgeobuf: 'flatgeobuf',
	gpkg: 'gpkg',
	covjson: 'covjson',
	json: 'json', geojson: 'json',
	csv: 'csv', tsv: 'tsv',
	kml: 'kml', kmz: 'kmz', gpx: 'gpx',
	zip: 'zip'
};

const ENCODED_TYPES = ['netcdf', 'geotiff', 'parquet', 'flatgeobuf', 'gpkg', 'zip', 'zarr-zip'];

export const SUPPORTED_EXTENSIONS = Object.keys(EXT);

function sniff(bytes) {
	const ascii = String.fromCharCode(...bytes.slice(0, 16));
	if ((bytes[0] === 0x49 && bytes[1] === 0x49 && (bytes[2] === 42 || bytes[2] === 43)) || (bytes[0] === 0x4d && bytes[1] === 0x4d && (bytes[3] === 42 || bytes[3] === 43))) {
		return 'geotiff';
	}
	if (isHdf5(bytes) || isNetCdf3(bytes)) {
		return 'netcdf';
	}
	if (ascii.startsWith('PAR1')) {
		return 'parquet';
	}
	if (bytes[0] === 0x66 && bytes[1] === 0x67 && bytes[2] === 0x62) {
		return 'flatgeobuf';
	}
	if (ascii.startsWith('SQLite format 3')) {
		return 'gpkg';
	}
	if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
		return 'zip';
	}
	return null;
}

export async function detectType(input) {
	if (input.isDirectory) {
		return 'zarr';
	}
	const ext = input.extension;
	const fromExt = EXT[ext] || null;
	// Zarr stores are directories, so there's nothing to sniff
	if (ext === 'zarr' || (input.url && /\.zarr\/?$/i.test(input.url.split(/[?#]/)[0]))) {
		return 'zarr';
	}
	const fromMime = MIME[input.type] || (input.type.includes('geotiff') ? 'geotiff' : null) || (input.type.includes('zarr') ? 'zarr' : null) || (input.type.includes('netcdf') ? 'netcdf' : null);
	let magic = null;
	try {
		magic = sniff(await input.head(16));
	} catch (e) {
		console.warn(e);
	}
	if (magic === 'zip' && (fromExt === 'zarr-zip' || fromMime === 'zarr' || /zarr/i.test(input.name))) {
		return 'zarr-zip';
	}
	if (fromMime === 'zarr' && input.url && !magic) {
		return 'zarr';
	}
	if (magic === 'zip' && fromExt === 'kmz') {
		return 'kmz';
	}
	if (magic) {
		return magic;
	}
	const type = fromMime || fromExt;
	// Text based formats don't have a magic number, but must not be binary data
	if (type && !ENCODED_TYPES.includes(type)) {
		return type;
	}
	return type || 'json';
}

async function readNd(input, nd) {
	const ds = new Dataset(input.name, nd.format);
	try {
		const { sources, table } = await interpretNd(nd, input.name);
		ds.rasters.push(...sources);
		ds.addTable(table, input.name);
		ds.info = describeNd(nd);
		if (sources.length === 0 && !table) {
			ds.warnings.push('No variables with spatial (x/y or lat/lon) dimensions were found.');
		}
	} catch (error) {
		nd.close();
		throw error;
	}
	ds.disposers.push(() => nd.close());
	return ds;
}

async function readNetCdf(input) {
	const buffer = await input.arrayBuffer();
	const bytes = new Uint8Array(buffer, 0, 8);
	const nd = isNetCdf3(bytes) ? await openNetCdf3(buffer) : await openHdf5(buffer);
	return readNd(input, nd);
}

async function readZarr(input) {
	let nd;
	if (input.isDirectory) {
		nd = await openZarr(new BlobMapStore(input.files));
	}
	else if (input.url && !input.blob) {
		nd = await openZarrFromUrl(input.url, input.headers);
	}
	else {
		nd = await openZarrFromZip(await input.getBlob());
	}
	return readNd(input, nd);
}

async function readGeoTiff(input, hints) {
	const options = { title: input.name, asset: hints.asset, stac: hints.stac };
	if (input.blob || !input.url) {
		options.blob = await input.getBlob();
	}
	else {
		options.url = input.url;
		options.headers = input.headers;
	}
	let source;
	try {
		source = await GeoTiffSource.open(options);
	} catch (error) {
		// Fall back to a full download, e.g. if range requests aren't supported
		if (!options.url) {
			throw error;
		}
		source = await GeoTiffSource.open({ ...options, url: null, blob: await input.getBlob() });
	}
	const ds = new Dataset(input.name, 'GeoTIFF');
	ds.rasters.push(source);
	ds.info = {
		size: `${source.width} x ${source.height}`,
		crs: source.crs,
		bbox: source.bbox,
		bands: source.bands,
		metadata: source.attrs
	};
	return ds;
}

async function readZip(input, hints) {
	const { unzip } = await import('unzipit');
	const { entries } = await unzip(await input.getBlob());
	const names = Object.keys(entries).filter(n => !n.endsWith('/') && !n.startsWith('__MACOSX'));
	if (names.some(n => /(^|\/)(\.zmetadata|\.zgroup|zarr\.json)$/.test(n))) {
		return readZarr(new DataInput({ name: input.name, blob: await input.getBlob() }));
	}
	if (names.some(n => n.toLowerCase().endsWith('.shp'))) {
		return readShapefileZip(input);
	}
	// Archives with multiple results, e.g. one GeoTIFF per date
	const ds = new Dataset(input.name, 'ZIP');
	const supported = names.filter(n => {
		const ext = n.split('.').pop().toLowerCase();
		return EXT[ext] && EXT[ext] !== 'zip';
	});
	for (const name of supported) {
		const blob = await entries[name].blob();
		const file = new File([blob], name.split('/').pop());
		try {
			const child = await readDataset(new DataInput({ name: file.name, blob: file }), hints);
			child.title = name;
			ds.merge(child);
		} catch (error) {
			ds.warnings.push(`${name}: ${error.message}`);
		}
	}
	const skipped = names.length - supported.length;
	if (skipped > 0) {
		ds.warnings.push(`${skipped} file(s) in the archive are not supported and were skipped.`);
	}
	ds.info = Object.assign({ files: names }, ds.info || {});
	return ds;
}

// hints: { asset, stac } from the openEO result metadata
export async function readDataset(input, hints = {}) {
	const type = await detectType(input);
	switch (type) {
		case 'geotiff':
			return readGeoTiff(input, hints);
		case 'netcdf':
			return readNetCdf(input);
		case 'zarr':
		case 'zarr-zip':
			return readZarr(input);
		case 'parquet':
			return readParquet(input);
		case 'flatgeobuf':
			return readFlatGeobuf(input);
		case 'gpkg':
			return readGeoPackage(input);
		case 'covjson':
			return readCovJson(JSON.parse(await input.text()), input.name);
		case 'csv':
			return readCsv(input);
		case 'tsv':
			return readCsv(input, ['\t']);
		case 'kml':
		case 'gpx':
			return readXmlVector(input, type);
		case 'kmz':
			return readKmz(input);
		case 'zip':
			return readZip(input, hints);
		case 'json':
		default:
			return readJson(input);
	}
}
