import * as zarr from 'zarrita';
import { NdDataset, NdVariable, scalarAttr } from './ndarray';

// Store backed by a map of relative paths to File/Blob objects, e.g. from a dropped directory
export class BlobMapStore {

	constructor(files) {
		this.files = files;
	}

	async get(key) {
		const file = this.files.get(key.replace(/^\//, ''));
		return file ? new Uint8Array(await file.arrayBuffer()) : undefined;
	}

}

function attrsOf(arr) {
	const attrs = {};
	for (const [k, v] of Object.entries(arr.attrs || {})) {
		if (k !== '_ARRAY_DIMENSIONS') {
			attrs[k] = scalarAttr(v);
		}
	}
	// xarray stores the fill value only in the array metadata for Zarr v2
	if (typeof attrs._FillValue === 'undefined' && Array.isArray(arr.attrs && arr.attrs._ARRAY_DIMENSIONS) && arr.fillValue !== null) {
		attrs._FillValue = scalarAttr(arr.fillValue);
	}
	return attrs;
}

export async function openZarr(store) {
	const s = await zarr.withMaybeConsolidatedMetadata(store);
	const grp = await zarr.open(s, { kind: 'group' });
	if (typeof s.contents !== 'function') {
		throw new Error('Zarr stores without consolidated metadata are not supported yet.');
	}
	const variables = [];
	for (const entry of s.contents()) {
		if (entry.kind !== 'array') {
			continue;
		}
		const path = entry.path.replace(/^\//, '');
		const arr = await zarr.open(grp.resolve(path), { kind: 'array' });
		const dims = (arr.dimensionNames && arr.dimensionNames.every(Boolean))
			? arr.dimensionNames
			: arr.shape.map((_, i) => `${path}_dim${i}`);
		variables.push(new NdVariable({
			name: path,
			dims,
			shape: arr.shape,
			dtype: arr.dtype,
			attrs: attrsOf(arr),
			reader: async sel => {
				if (arr.shape.length === 0) {
					const r = await zarr.get(arr);
					return { data: r.data ? r.data : [r], shape: [] };
				}
				const selection = arr.shape.map((_, i) => {
					const x = sel ? sel[i] : null;
					return Array.isArray(x) ? zarr.slice(x[0], x[1], x[2] || 1) : (typeof x === 'number' ? x : null);
				});
				const r = await zarr.get(arr, selection);
				return { data: r.data, shape: r.shape };
			}
		}));
	}
	return new NdDataset({ attrs: Object.fromEntries(Object.entries(grp.attrs || {}).map(([k, v]) => [k, scalarAttr(v)])), variables, format: 'Zarr' });
}

export async function openZarrFromUrl(url, headers = {}) {
	return openZarr(new zarr.FetchStore(url.replace(/\/$/, ''), { overrides: { headers } }));
}

export async function openZarrFromZip(blob) {
	const { default: ZipFileStore } = await import('@zarrita/storage/zip');
	const store = ZipFileStore.fromBlob(blob, { transformEntries: stripZipRoot });
	return openZarr(store);
}

// Zip files often contain the store in a sub folder, e.g. result.zarr/
function stripZipRoot(entries) {
	const names = Object.keys(entries);
	const isRootMarker = n => /^(\.zmetadata|\.zgroup|zarr\.json)$/.test(n);
	if (names.some(isRootMarker)) {
		return entries;
	}
	const marker = names
		.filter(n => /\/(\.zmetadata|\.zgroup|zarr\.json)$/.test(n))
		.sort((a, b) => a.split('/').length - b.split('/').length)[0];
	if (!marker) {
		return entries;
	}
	const prefix = marker.slice(0, marker.lastIndexOf('/') + 1);
	return Object.fromEntries(names.filter(n => n.startsWith(prefix)).map(n => [n.slice(prefix.length), entries[n]]));
}
