const TYPES = ['Geometry', 'Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'];

// Parses (E)WKB and ISO WKB including Z/M variants into GeoJSON geometries (Z kept, M dropped)
export function parseWkb(bytes, offset = 0) {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let pos = offset;
	const read = () => {
		const le = view.getUint8(pos) === 1;
		pos += 1;
		let type = view.getUint32(pos, le);
		pos += 4;
		let hasZ = false, hasM = false;
		// EWKB flags
		if (type & 0x80000000) { hasZ = true; }
		if (type & 0x40000000) { hasM = true; }
		if (type & 0x20000000) { pos += 4; }
		type &= 0x0fffffff;
		// ISO WKB: 1000 = Z, 2000 = M, 3000 = ZM
		if (type >= 3000) { hasZ = hasM = true; type -= 3000; }
		else if (type >= 2000) { hasM = true; type -= 2000; }
		else if (type >= 1000) { hasZ = true; type -= 1000; }
		const dims = 2 + (hasZ ? 1 : 0) + (hasM ? 1 : 0);
		const point = () => {
			const c = [];
			for (let i = 0; i < dims; i++) {
				c.push(view.getFloat64(pos, le));
				pos += 8;
			}
			return hasZ ? c.slice(0, 3) : c.slice(0, 2);
		};
		const count = () => {
			const n = view.getUint32(pos, le);
			pos += 4;
			return n;
		};
		const points = () => Array.from({ length: count() }, point);
		const rings = () => Array.from({ length: count() }, points);
		switch (TYPES[type]) {
			case 'Point': {
				const c = point();
				return c.every(Number.isNaN) ? null : { type: 'Point', coordinates: c };
			}
			case 'LineString':
				return { type: 'LineString', coordinates: points() };
			case 'Polygon':
				return { type: 'Polygon', coordinates: rings() };
			case 'MultiPoint':
			case 'MultiLineString':
			case 'MultiPolygon': {
				const parts = Array.from({ length: count() }, read).filter(Boolean);
				return { type: TYPES[type], coordinates: parts.map(p => p.coordinates) };
			}
			case 'GeometryCollection':
				return { type: 'GeometryCollection', geometries: Array.from({ length: count() }, read).filter(Boolean) };
			default:
				throw new Error(`Unsupported WKB geometry type ${type}`);
		}
	};
	return read();
}

// GeoPackage binary: "GP" header with optional envelope, followed by WKB
export function parseGpkgGeometry(bytes) {
	if (!bytes || bytes.length < 8 || bytes[0] !== 0x47 || bytes[1] !== 0x50) {
		return null;
	}
	const flags = bytes[3];
	if (flags & 0x10) {
		// empty geometry
		return null;
	}
	const envelopeSizes = [0, 32, 48, 48, 64];
	const envelope = envelopeSizes[(flags >> 1) & 0x07] || 0;
	return parseWkb(bytes, 8 + envelope);
}
