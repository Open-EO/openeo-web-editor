import proj4 from 'proj4';

export const WGS84 = 'EPSG:4326';
export const WEB_MERCATOR = 'EPSG:3857';
const MAX_LAT = 85.0511287798066;

let epsgDb = null;
let customId = 0;
const transformers = new Map();

async function loadEpsg(id) {
	const code = `EPSG:${id}`;
	if (proj4.defs(code)) {
		return code;
	}
	if (!epsgDb) {
		epsgDb = (await import('../assets/epsg-proj.json')).default;
	}
	const entry = epsgDb[String(id)];
	if (entry && entry[0]) {
		proj4.defs(code, entry[0]);
		return code;
	}
	return null;
}

function epsgFromText(text) {
	const patterns = [
		/^\s*EPSG:(\d+)\s*$/i,
		/opengis\.net\/def\/crs\/EPSG\/[^/]+\/(\d+)\s*$/i,
		/^urn:ogc:def:crs:EPSG:[^:]*:(\d+)$/i,
		// Top-level authority of a WKT string is the last ID/AUTHORITY before the final bracket
		/(?:ID|AUTHORITY)\[\s*"EPSG"\s*,\s*"?(\d+)"?\s*\]\s*\]\s*$/i
	];
	for (const p of patterns) {
		const m = text.match(p);
		if (m) {
			return parseInt(m[1], 10);
		}
	}
	return null;
}

function isWgs84Alias(text) {
	return /CRS84|OGC\/1\.3\/CRS84|urn:ogc:def:crs:OGC:1\.3:CRS84|^WGS ?84$/i.test(text.trim());
}

// Accepts EPSG codes, OGC URIs, WKT1/WKT2, PROJJSON and proj4 strings; returns a proj4 definition name or null.
export async function resolveCrs(crs) {
	if (crs === null || typeof crs === 'undefined' || crs === '') {
		return null;
	}
	try {
		if (typeof crs === 'number' || (typeof crs === 'bigint')) {
			return await loadEpsg(Number(crs));
		}
		if (typeof crs === 'object') {
			const id = crs.id || (Array.isArray(crs.ids) ? crs.ids[0] : null);
			if (id && String(id.authority).toUpperCase() === 'EPSG') {
				const code = await loadEpsg(id.code);
				if (code) {
					return code;
				}
			}
			if (id && String(id.authority).toUpperCase() === 'OGC' && String(id.code).toUpperCase() === 'CRS84') {
				return WGS84;
			}
			return register(crs);
		}
		if (typeof crs === 'string') {
			if (isWgs84Alias(crs)) {
				return WGS84;
			}
			const epsg = epsgFromText(crs);
			if (epsg) {
				const code = await loadEpsg(epsg);
				if (code) {
					return code;
				}
			}
			if (/^\s*[{]/.test(crs)) {
				return resolveCrs(JSON.parse(crs));
			}
			return register(crs);
		}
	} catch (error) {
		console.warn('Unable to resolve CRS', crs, error);
	}
	return null;
}

function register(def) {
	const name = `CUSTOM:${++customId}`;
	proj4.defs(name, def);
	// proj4 accepts many invalid inputs silently, so verify that the definition is usable
	proj4(name, WGS84).forward([0, 0]);
	return name;
}

export function getTransformer(from, to) {
	const key = `${from}|${to}`;
	if (!transformers.has(key)) {
		transformers.set(key, from === to ? { forward: c => c, inverse: c => c } : proj4(from, to));
	}
	return transformers.get(key);
}

export function isGeographic(crs) {
	const def = proj4.defs(crs);
	return Boolean(def && def.projName === 'longlat');
}

export function clampLat(lat) {
	return Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
}

// Transforms a bbox by sampling its edges, which handles curved edges after reprojection.
export function transformBbox(bbox, from, to, steps = 20) {
	const t = getTransformer(from, to);
	const [minx, miny, maxx, maxy] = bbox;
	let out = [Infinity, Infinity, -Infinity, -Infinity];
	for (let i = 0; i <= steps; i++) {
		const fx = minx + (maxx - minx) * i / steps;
		const fy = miny + (maxy - miny) * i / steps;
		for (const p of [[fx, miny], [fx, maxy], [minx, fy], [maxx, fy]]) {
			let q;
			try {
				q = t.forward(to === WEB_MERCATOR && from === WGS84 ? [p[0], clampLat(p[1])] : p);
			} catch (e) {
				continue;
			}
			if (!Number.isFinite(q[0]) || !Number.isFinite(q[1])) {
				continue;
			}
			out = [Math.min(out[0], q[0]), Math.min(out[1], q[1]), Math.max(out[2], q[0]), Math.max(out[3], q[1])];
		}
	}
	return out.every(Number.isFinite) ? out : null;
}

export function toMercatorBbox(bbox, crs) {
	if (crs === WEB_MERCATOR) {
		return bbox.slice();
	}
	let ll = crs === WGS84 ? bbox.slice() : transformBbox(bbox, crs, WGS84);
	if (!ll) {
		return null;
	}
	ll = [Math.max(-180, ll[0]), clampLat(ll[1]), Math.min(180, ll[2]), clampLat(ll[3])];
	return transformBbox(ll, WGS84, WEB_MERCATOR, 4);
}

function reprojectCoords(coords, fn) {
	if (typeof coords[0] === 'number') {
		const p = fn(coords.slice(0, 2));
		return coords.length > 2 ? [p[0], p[1], ...coords.slice(2)] : p;
	}
	return coords.map(c => reprojectCoords(c, fn));
}

function reprojectGeometry(geometry, fn) {
	if (!geometry) {
		return geometry;
	}
	if (geometry.type === 'GeometryCollection') {
		return { ...geometry, geometries: geometry.geometries.map(g => reprojectGeometry(g, fn)) };
	}
	return { ...geometry, coordinates: reprojectCoords(geometry.coordinates, fn) };
}

export function reprojectGeoJson(geojson, from, to = WGS84) {
	if (!from || from === to) {
		return geojson;
	}
	const t = getTransformer(from, to);
	const fn = c => t.forward(c);
	if (geojson.type === 'FeatureCollection') {
		return { ...geojson, features: geojson.features.map(f => ({ ...f, geometry: reprojectGeometry(f.geometry, fn) })) };
	}
	if (geojson.type === 'Feature') {
		return { ...geojson, geometry: reprojectGeometry(geojson.geometry, fn) };
	}
	return reprojectGeometry(geojson, fn);
}

export function geoJsonBbox(geojson) {
	const b = [Infinity, Infinity, -Infinity, -Infinity];
	const visit = c => {
		if (typeof c[0] === 'number') {
			b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]);
			b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]);
		}
		else {
			c.forEach(visit);
		}
	};
	const visitGeom = g => {
		if (!g) {
			return;
		}
		if (g.type === 'GeometryCollection') {
			g.geometries.forEach(visitGeom);
		}
		else if (g.coordinates) {
			visit(g.coordinates);
		}
	};
	if (geojson.type === 'FeatureCollection') {
		geojson.features.forEach(f => visitGeom(f.geometry));
	}
	else if (geojson.type === 'Feature') {
		visitGeom(geojson.geometry);
	}
	else {
		visitGeom(geojson);
	}
	return b.every(Number.isFinite) ? b : null;
}
