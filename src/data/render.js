import { getTransformer, WEB_MERCATOR } from './crs';
import { getLut } from './colormaps';

const GRID_STEP = 8;

// Nearest-neighbour warp of a north-up source grid onto a Web Mercator grid.
// Source coordinates are computed exactly on a coarse grid and interpolated in between.
export function warpToMercator(src, dst) {
	const { width: dw, height: dh, bbox: db } = dst;
	const { width: sw, height: sh, bbox: sb, bands } = src;
	const out = bands.map(() => new Float32Array(dw * dh).fill(NaN));
	const t = getTransformer(WEB_MERCATOR, src.crs);
	const gw = Math.ceil(dw / GRID_STEP) + 1;
	const gh = Math.ceil(dh / GRID_STEP) + 1;
	const gx = new Float64Array(gw * gh);
	const gy = new Float64Array(gw * gh);
	const pxw = (db[2] - db[0]) / dw;
	const pxh = (db[3] - db[1]) / dh;
	const sxScale = sw / (sb[2] - sb[0]);
	const syScale = sh / (sb[3] - sb[1]);
	for (let j = 0; j < gh; j++) {
		const y = db[3] - Math.min(j * GRID_STEP, dh) * pxh - pxh / 2;
		for (let i = 0; i < gw; i++) {
			const x = db[0] + Math.min(i * GRID_STEP, dw) * pxw + pxw / 2;
			let p;
			try {
				p = t.forward([x, y]);
			} catch (e) {
				p = [NaN, NaN];
			}
			const k = j * gw + i;
			gx[k] = (p[0] - sb[0]) * sxScale;
			gy[k] = (sb[3] - p[1]) * syScale;
		}
	}
	const nb = bands.length;
	for (let row = 0; row < dh; row++) {
		const j = Math.floor(row / GRID_STEP);
		const fy = (row - j * GRID_STEP) / GRID_STEP;
		for (let col = 0; col < dw; col++) {
			const i = Math.floor(col / GRID_STEP);
			const fx = (col - i * GRID_STEP) / GRID_STEP;
			const k00 = j * gw + i, k10 = k00 + 1, k01 = k00 + gw, k11 = k01 + 1;
			const sx = (gx[k00] * (1 - fx) + gx[k10] * fx) * (1 - fy) + (gx[k01] * (1 - fx) + gx[k11] * fx) * fy;
			const sy = (gy[k00] * (1 - fx) + gy[k10] * fx) * (1 - fy) + (gy[k01] * (1 - fx) + gy[k11] * fx) * fy;
			if (!(sx >= 0 && sx < sw && sy >= 0 && sy < sh)) {
				continue;
			}
			const si = Math.floor(sy) * sw + Math.floor(sx);
			const di = row * dw + col;
			for (let b = 0; b < nb; b++) {
				out[b][di] = bands[b][si];
			}
		}
	}
	return out;
}

// style: { mode: 'single' | 'rgb' | 'palette', band, rgb: [r, g, b], ranges: [[min, max], ...], colormap, reverse, palette }
export function colorize(grid, width, height, style) {
	const img = new ImageData(width, height);
	const px = img.data;
	const n = width * height;
	const norm = (v, [min, max]) => (v - min) / (max - min);
	if (style.mode === 'rgb') {
		const [r, g, b] = style.rgb.map(i => grid[i]);
		const [rr, gr, br] = style.rgb.map(i => style.ranges[i]);
		for (let i = 0; i < n; i++) {
			const rv = r[i], gv = g[i], bv = b[i];
			if (Number.isNaN(rv) && Number.isNaN(gv) && Number.isNaN(bv)) {
				continue;
			}
			px[i * 4] = norm(rv, rr) * 255;
			px[i * 4 + 1] = norm(gv, gr) * 255;
			px[i * 4 + 2] = norm(bv, br) * 255;
			px[i * 4 + 3] = 255;
		}
	}
	else if (style.mode === 'palette' && Array.isArray(style.palette)) {
		const data = grid[style.band];
		for (let i = 0; i < n; i++) {
			const v = data[i];
			const c = Number.isNaN(v) ? null : style.palette[v];
			if (!c || c[3] === 0) {
				continue;
			}
			px[i * 4] = c[0]; px[i * 4 + 1] = c[1]; px[i * 4 + 2] = c[2]; px[i * 4 + 3] = 255;
		}
	}
	else {
		const data = grid[style.band];
		const range = style.ranges[style.band];
		const lut = getLut(style.colormap, style.reverse);
		for (let i = 0; i < n; i++) {
			const v = data[i];
			if (Number.isNaN(v)) {
				continue;
			}
			const k = Math.max(0, Math.min(255, Math.round(norm(v, range) * 255))) * 3;
			px[i * 4] = lut[k]; px[i * 4 + 1] = lut[k + 1]; px[i * 4 + 2] = lut[k + 2]; px[i * 4 + 3] = 255;
		}
	}
	return img;
}
