// Shared helpers for n-dimensional data. A selection entry is either an index (dimension is dropped),
// null (full dimension) or [start, stop, step].

export function normalizeSelection(sel, shape) {
	return shape.map((size, i) => {
		const s = sel ? sel[i] : null;
		if (typeof s === 'number') {
			return s;
		}
		if (Array.isArray(s)) {
			return [s[0] ?? 0, Math.min(s[1] ?? size, size), s[2] || 1];
		}
		return [0, size, 1];
	});
}

export function selectionShape(norm) {
	return norm.filter(s => Array.isArray(s)).map(([a, b, c]) => Math.max(0, Math.ceil((b - a) / c)));
}

// Slices a flat C-order array in memory
export function sliceFlat(data, shape, sel) {
	const norm = normalizeSelection(sel, shape);
	const outShape = selectionShape(norm);
	const total = outShape.reduce((a, b) => a * b, 1);
	const Ctor = ArrayBuffer.isView(data) ? data.constructor : Array;
	const out = new Ctor(total);
	const strides = shape.map((_, i) => shape.slice(i + 1).reduce((a, b) => a * b, 1));
	const ranges = norm.map(s => typeof s === 'number' ? [s] : Array.from({ length: Math.max(0, Math.ceil((s[1] - s[0]) / s[2])) }, (_, k) => s[0] + k * s[2]));
	let o = 0;
	const walk = (dim, offset) => {
		if (dim === shape.length) {
			out[o++] = data[offset];
			return;
		}
		for (const idx of ranges[dim]) {
			walk(dim + 1, offset + idx * strides[dim]);
		}
	};
	if (shape.length === 0) {
		out[0] = data[0];
	}
	else {
		walk(0, 0);
	}
	return { data: out, shape: outShape };
}

export function scalarAttr(value) {
	if (typeof value === 'bigint') {
		return Number(value);
	}
	if ((ArrayBuffer.isView(value) || Array.isArray(value)) && value.length === 1) {
		return scalarAttr(value[0]);
	}
	if (ArrayBuffer.isView(value)) {
		return Array.from(value, v => typeof v === 'bigint' ? Number(v) : v);
	}
	return value;
}

export function toPlainArray(data) {
	if (!data) {
		return [];
	}
	if (typeof data.get === 'function' && typeof data.length === 'number' && !ArrayBuffer.isView(data)) {
		return Array.from({ length: data.length }, (_, i) => data.get(i));
	}
	return Array.from(data, v => typeof v === 'bigint' ? Number(v) : v);
}

export class NdVariable {

	constructor({ name, dims, shape, dtype = null, attrs = {}, reader }) {
		this.name = name;
		this.dims = dims;
		this.shape = shape;
		this.dtype = dtype;
		this.attrs = attrs;
		this.reader = reader;
	}

	get size() {
		return this.shape.reduce((a, b) => a * b, 1);
	}

	async read(sel = null) {
		return await this.reader(sel);
	}

	async values() {
		return toPlainArray((await this.read(null)).data);
	}

}

export class NdDataset {

	constructor({ attrs = {}, variables = [], format = null, close = null }) {
		this.attrs = attrs;
		this.variables = variables;
		this.format = format;
		this._close = close;
	}

	get(name) {
		return this.variables.find(v => v.name === name) || null;
	}

	close() {
		if (this._close) {
			this._close();
		}
	}

}
