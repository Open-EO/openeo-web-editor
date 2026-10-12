import { NdDataset, NdVariable, scalarAttr, sliceFlat } from './ndarray';

export function isNetCdf3(bytes) {
	return bytes.length >= 4 && bytes[0] === 0x43 && bytes[1] === 0x44 && bytes[2] === 0x46 && bytes[3] <= 5;
}

// netCDF classic / 64-bit offset via netcdfjs, which decodes variables completely
export async function openNetCdf3(buffer) {
	const { NetCDFReader } = await import('netcdfjs');
	const reader = new NetCDFReader(buffer);
	const dimNames = reader.dimensions.map(d => d.name);
	const recordDim = reader.recordDimension;
	const dimSizes = reader.dimensions.map((d, i) => (recordDim && i === recordDim.id && !d.size) ? recordDim.length : d.size);
	const attrs = list => Object.fromEntries((list || []).map(a => [a.name, scalarAttr(a.value)]));
	const cache = new Map();
	const variables = reader.variables.map(v => {
		const dims = v.dimensions.map(i => dimNames[i]);
		const shape = v.dimensions.map(i => dimSizes[i]);
		return new NdVariable({
			name: v.name,
			dims,
			shape,
			dtype: v.type,
			attrs: attrs(v.attributes),
			reader: async sel => {
				if (!cache.has(v.name)) {
					let data = reader.getDataVariable(v.name);
					if (Array.isArray(data) && Array.isArray(data[0])) {
						data = data.flat(Infinity);
					}
					if (v.type === 'char' && typeof data === 'string') {
						data = [data];
					}
					cache.set(v.name, data);
				}
				const data = cache.get(v.name);
				if (shape.length === 0) {
					return { data, shape: [] };
				}
				return sliceFlat(data, shape, sel);
			}
		});
	});
	return new NdDataset({ attrs: attrs(reader.globalAttributes), variables, format: 'netCDF3' });
}
