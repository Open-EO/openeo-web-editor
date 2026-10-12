import { NdDataset, NdVariable, normalizeSelection, scalarAttr, selectionShape } from './ndarray';

let fileCounter = 0;

function readAttrs(entity) {
	const attrs = {};
	for (const [name, attr] of Object.entries(entity.attrs || {})) {
		if (['DIMENSION_LIST', 'REFERENCE_LIST', 'CLASS', '_Netcdf4Dimid', '_Netcdf4Coordinates', '_NCProperties'].includes(name)) {
			continue;
		}
		try {
			attrs[name] = scalarAttr(attr.value);
		} catch (e) {
			// Unsupported attribute types (e.g. references) are skipped
		}
	}
	return attrs;
}

function collectDatasets(h5, group, prefix, out) {
	for (const key of group.keys()) {
		const entity = group.get(key);
		const path = prefix ? `${prefix}/${key}` : key;
		if (entity instanceof h5.Dataset) {
			out.push({ path, dataset: entity });
		}
		else if (entity instanceof h5.Group) {
			collectDatasets(h5, entity, path, out);
		}
	}
	return out;
}

// netCDF4 and HDF5 via h5wasm. The file is held in the in-memory file system of the WASM module.
export async function openHdf5(buffer) {
	const h5 = await import('h5wasm');
	const { FS } = await h5.ready;
	const filename = `/data_${++fileCounter}.h5`;
	FS.writeFile(filename, new Uint8Array(buffer));
	const file = new h5.File(filename, 'r');

	const variables = collectDatasets(h5, file, '', []).map(({ path, dataset }) => {
		const shape = dataset.shape || [];
		const dims = shape.map((size, i) => {
			try {
				const scales = dataset.get_attached_scales(i);
				if (scales && scales.length > 0) {
					return scales[0].replace(/^\//, '');
				}
			} catch (e) {
				// no dimension scales attached
			}
			// Dimension scales are 1D datasets that are their own dimension
			if (shape.length === 1 && dataset.attrs && dataset.attrs.CLASS && String(dataset.attrs.CLASS.value) === 'DIMENSION_SCALE') {
				return path;
			}
			return `${path}_dim${i}`;
		});
		return new NdVariable({
			name: path,
			dims,
			shape,
			dtype: dataset.dtype,
			attrs: readAttrs(dataset),
			reader: async sel => {
				if (shape.length === 0) {
					return { data: [dataset.value], shape: [] };
				}
				const norm = normalizeSelection(sel, shape);
				const ranges = norm.map(s => typeof s === 'number' ? [s, s + 1] : s);
				const data = ranges.every(r => r[0] === 0 && r[2] === 1) && ranges.every((r, i) => r[1] === shape[i])
					? dataset.value
					: dataset.slice(ranges);
				return { data, shape: selectionShape(norm) };
			}
		});
	});

	return new NdDataset({
		attrs: readAttrs(file),
		variables,
		format: 'HDF5 / netCDF4',
		close: () => {
			try {
				file.close();
				FS.unlink(filename);
			} catch (e) {
				console.warn(e);
			}
		}
	});
}

export function isHdf5(bytes) {
	return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x48 && bytes[2] === 0x44 && bytes[3] === 0x46;
}
