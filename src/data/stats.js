// Approximate percentiles on a subsample of finite values
export function percentileRange(array, lower = 0.02, upper = 0.98, maxSamples = 200000) {
	const step = Math.max(1, Math.floor(array.length / maxSamples));
	const values = [];
	for (let i = 0; i < array.length; i += step) {
		const v = array[i];
		if (Number.isFinite(v)) {
			values.push(v);
		}
	}
	if (values.length === 0) {
		return null;
	}
	values.sort((a, b) => a - b);
	const at = p => values[Math.min(values.length - 1, Math.max(0, Math.round(p * (values.length - 1))))];
	let min = at(lower);
	let max = at(upper);
	if (min === max) {
		min = values[0];
		max = values[values.length - 1];
	}
	if (min === max) {
		max = min + 1;
	}
	return [min, max];
}

export function toFloat32(array, nodata = [], scale = 1, offset = 0) {
	const out = new Float32Array(array.length);
	const nd = nodata.filter(v => v !== null && typeof v !== 'undefined').map(Number);
	const checkNaN = nd.some(v => Number.isNaN(v));
	const ndValues = nd.filter(v => !Number.isNaN(v));
	for (let i = 0; i < array.length; i++) {
		let v = Number(array[i]);
		if ((checkNaN && Number.isNaN(v)) || ndValues.includes(v)) {
			out[i] = NaN;
		}
		else {
			out[i] = v * scale + offset;
		}
	}
	return out;
}

export function isNumericArray(a) {
	return ArrayBuffer.isView(a) && !(a instanceof DataView);
}
