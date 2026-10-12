// Control points sampled from matplotlib / ColorBrewer colormaps
const STOPS = {
	viridis: ['#440154', '#482878', '#3e4a89', '#31688e', '#26828e', '#1f9e89', '#35b779', '#6ece58', '#b5de2b', '#fde725'],
	magma: ['#000004', '#180f3d', '#440f76', '#721f81', '#9e2f7f', '#cd4071', '#f1605d', '#fd9668', '#feca8d', '#fcfdbf'],
	inferno: ['#000004', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60', '#cf4446', '#ed6925', '#fb9b06', '#f7d13d', '#fcffa4'],
	plasma: ['#0d0887', '#46039f', '#7201a8', '#9c179e', '#bd3786', '#d8576b', '#ed7953', '#fb9f3a', '#fdca26', '#f0f921'],
	cividis: ['#00224e', '#123570', '#3b496c', '#575d6d', '#707173', '#8a8678', '#a59c74', '#c3b369', '#e1cc55', '#fee838'],
	greys: ['#000000', '#ffffff'],
	ndvi: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'],
	rdbu: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
	spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'],
	terrain: ['#333399', '#0294fa', '#24d36d', '#ffff99', '#aa926b', '#806059', '#ffffff'],
	blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b']
};

export const COLORMAPS = Object.keys(STOPS);

const cache = new Map();

function hexToRgb(hex) {
	const n = parseInt(hex.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Returns a 256 * 3 lookup table
export function getLut(name, reverse = false) {
	const key = `${name}|${reverse}`;
	if (cache.has(key)) {
		return cache.get(key);
	}
	let stops = (STOPS[name] || STOPS.viridis).map(hexToRgb);
	if (reverse) {
		stops = stops.slice().reverse();
	}
	const lut = new Uint8ClampedArray(256 * 3);
	for (let i = 0; i < 256; i++) {
		const pos = i / 255 * (stops.length - 1);
		const lo = Math.floor(pos);
		const hi = Math.min(lo + 1, stops.length - 1);
		const f = pos - lo;
		for (let c = 0; c < 3; c++) {
			lut[i * 3 + c] = stops[lo][c] + (stops[hi][c] - stops[lo][c]) * f;
		}
	}
	cache.set(key, lut);
	return lut;
}

export function cssGradient(name, reverse = false) {
	let stops = STOPS[name] || STOPS.viridis;
	if (reverse) {
		stops = stops.slice().reverse();
	}
	return `linear-gradient(to right, ${stops.join(', ')})`;
}

// MapLibre interpolate expression stops for data-driven vector styling
export function expressionStops(name, min, max, reverse = false) {
	let stops = STOPS[name] || STOPS.viridis;
	if (reverse) {
		stops = stops.slice().reverse();
	}
	if (min === max) {
		max = min + 1;
	}
	return stops.flatMap((color, i) => [min + (max - min) * i / (stops.length - 1), color]);
}

export function suggestColormap(name = '') {
	const n = String(name).toLowerCase();
	if (/ndvi|evi|savi|ndwi|ndmi|nbr|index/.test(n)) {
		return 'ndvi';
	}
	if (/dem|elev|height|terrain|altitude/.test(n)) {
		return 'terrain';
	}
	if (/temp|lst|t2m/.test(n)) {
		return 'magma';
	}
	return 'viridis';
}
