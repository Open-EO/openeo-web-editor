import { colorize, warpToMercator } from '../../../data/render';
import { getTransformer, toMercatorBbox, transformBbox, WEB_MERCATOR, WGS84 } from '../../../data/crs';
import { percentileRange } from '../../../data/stats';
import { suggestColormap } from '../../../data/colormaps';

const OVERVIEW_SIZE = 1024;
const DETAIL_MAX = 2048;
const MAX_READ_BANDS = 16;
let counter = 0;

function intersect(a, b) {
	const r = [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])];
	return r[2] > r[0] && r[3] > r[1] ? r : null;
}

function findBand(bands, patterns) {
	return bands.findIndex(b => patterns.some(p => p.test(String(b.name))));
}

export function defaultStyle(source) {
	const bands = source.bands;
	if (source.palette && bands.length === 1) {
		return { mode: 'palette', band: 0, rgb: [0, 0, 0], ranges: [], colormap: 'viridis', reverse: false };
	}
	const r = findBand(bands, [/^(b0?4|red|r)$/i, /red/i]);
	const g = findBand(bands, [/^(b0?3|green|g)$/i, /green/i]);
	const b = findBand(bands, [/^(b0?2|blue|b)$/i, /blue/i]);
	if (r >= 0 && g >= 0 && b >= 0) {
		return { mode: 'rgb', band: 0, rgb: [r, g, b], ranges: [], colormap: 'viridis', reverse: false };
	}
	return { mode: 'single', band: 0, rgb: [0, Math.min(1, bands.length - 1), Math.min(2, bands.length - 1)], ranges: [], colormap: suggestColormap(bands[0] && bands[0].name), reverse: false };
}

export default class RasterLayer {

	constructor(map, source, title = null) {
		this.id = `raster-${++counter}`;
		this.kind = 'raster';
		this.map = map;
		this.source = source;
		this.title = title || source.title || 'Raster';
		this.time = source.times ? 0 : null;
		this.extra = Object.fromEntries((source.extraDims || []).map(d => [d.name, 0]));
		this.visible = true;
		this.opacity = 1;
		this.extent = toMercatorBbox(source.bbox, source.crs);
		this.style = defaultStyle(source);
		this.overview = null;
		this.detail = null;
		this.overviewToken = 0;
		this.detailToken = 0;
		this.urls = {};
		this.loading = 0;
		this.onChange = null;
		this.readAll = source.bands.length <= MAX_READ_BANDS;
	}

	get layerIds() {
		return [`${this.id}-overview`, `${this.id}-detail`];
	}

	get bounds() {
		const t = getTransformer(WEB_MERCATOR, WGS84);
		const sw = t.forward([this.extent[0], this.extent[1]]);
		const ne = t.forward([this.extent[2], this.extent[3]]);
		return [sw, ne];
	}

	coordinates(bbox) {
		const t = getTransformer(WEB_MERCATOR, WGS84);
		const [w, s, e, n] = bbox;
		return [t.forward([w, n]), t.forward([e, n]), t.forward([e, s]), t.forward([w, s])];
	}

	neededBands() {
		if (this.readAll) {
			return null;
		}
		return Array.from(new Set(this.style.mode === 'rgb' ? this.style.rgb : [this.style.band]));
	}

	async renderGrid(bbox, maxPx) {
		const aspect = (bbox[2] - bbox[0]) / (bbox[3] - bbox[1]);
		const width = Math.max(1, Math.round(aspect >= 1 ? maxPx : maxPx * aspect));
		const height = Math.max(1, Math.round(aspect >= 1 ? maxPx / aspect : maxPx));
		const srcBbox = transformBbox(bbox, WEB_MERCATOR, this.source.crs);
		const window = srcBbox && intersect(srcBbox, this.source.bbox);
		if (!window) {
			return null;
		}
		const data = await this.source.read({ bbox: window, maxWidth: width, maxHeight: height, time: this.time || 0, extra: this.extra, bands: this.neededBands() });
		if (!data) {
			return null;
		}
		const grid = warpToMercator({ crs: this.source.crs, bbox: data.bbox, width: data.width, height: data.height, bands: data.bands }, { bbox, width, height });
		return { bbox, width, height, grid };
	}

	ensureRanges(grid) {
		const indices = this.style.mode === 'rgb' ? this.style.rgb : [this.style.band];
		for (const i of indices) {
			if (!this.style.ranges[i] && grid[i]) {
				const meta = this.source.bands[i] || {};
				this.style.ranges[i] = percentileRange(grid[i]) || [meta.min ?? 0, meta.max ?? 1];
			}
		}
	}

	async toUrl(rendered) {
		const canvas = document.createElement('canvas');
		canvas.width = rendered.width;
		canvas.height = rendered.height;
		canvas.getContext('2d').putImageData(colorize(rendered.grid, rendered.width, rendered.height, { ...this.style, palette: this.source.palette }), 0, 0);
		const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
		return URL.createObjectURL(blob);
	}

	setImage(which, rendered, url) {
		const sourceId = `${this.id}-${which}`;
		const coordinates = this.coordinates(rendered.bbox);
		const existing = this.map.getSource(sourceId);
		if (existing) {
			existing.updateImage({ url, coordinates });
		}
		else {
			this.map.addSource(sourceId, { type: 'image', url, coordinates });
			this.map.addLayer({
				id: sourceId,
				type: 'raster',
				source: sourceId,
				layout: { visibility: this.visible ? 'visible' : 'none' },
				paint: { 'raster-opacity': this.opacity, 'raster-resampling': 'nearest', 'raster-fade-duration': 0 }
			}, this.beforeId(which));
		}
		if (this.urls[which]) {
			URL.revokeObjectURL(this.urls[which]);
		}
		this.urls[which] = url;
	}

	// Keep the detail image directly above the overview
	beforeId(which) {
		if (which === 'overview' && this.map.getLayer(`${this.id}-detail`)) {
			return `${this.id}-detail`;
		}
		return undefined;
	}

	async track(promise) {
		this.loading++;
		this.changed();
		try {
			return await promise;
		} finally {
			this.loading--;
			this.changed();
		}
	}

	changed() {
		if (this.onChange) {
			this.onChange(this);
		}
	}

	async renderOverview() {
		const token = ++this.overviewToken;
		const size = Math.min(OVERVIEW_SIZE, Math.max(64, Math.max(this.source.width, this.source.height) * 2));
		const rendered = await this.track(this.renderGrid(this.extent, size));
		if (token !== this.overviewToken || !rendered) {
			return;
		}
		this.ensureRanges(rendered.grid);
		this.overview = rendered;
		this.setImage('overview', rendered, await this.toUrl(rendered));
	}

	async renderDetail() {
		if (!this.visible || !this.overview) {
			return;
		}
		const token = ++this.detailToken;
		const canvas = this.map.getCanvas();
		const b = this.map.getBounds();
		const t = getTransformer(WGS84, WEB_MERCATOR);
		const clampLat = lat => Math.max(-85.05, Math.min(85.05, lat));
		const sw = t.forward([Math.max(-180, b.getWest()), clampLat(b.getSouth())]);
		const ne = t.forward([Math.min(180, b.getEast()), clampLat(b.getNorth())]);
		const view = intersect([sw[0], sw[1], ne[0], ne[1]], this.extent);
		if (!view) {
			return this.hideDetail();
		}
		const viewRes = (ne[0] - sw[0]) / canvas.clientWidth;
		const overviewRes = (this.extent[2] - this.extent[0]) / this.overview.width;
		// Native resolution in Web Mercator units, roughly
		const nativeRes = (this.extent[2] - this.extent[0]) / this.source.width;
		if (overviewRes <= Math.max(viewRes, nativeRes) * 1.5) {
			return this.hideDetail();
		}
		const px = Math.min(DETAIL_MAX, Math.ceil(Math.max((view[2] - view[0]), (view[3] - view[1])) / viewRes * Math.min(2, window.devicePixelRatio || 1)));
		const rendered = await this.track(this.renderGrid(view, px));
		if (token !== this.detailToken || !rendered) {
			return;
		}
		this.detail = rendered;
		this.setImage('detail', rendered, await this.toUrl(rendered));
		this.setVisibility(this.visible);
	}

	hideDetail() {
		this.detailToken++;
		this.detail = null;
		if (this.map.getLayer(`${this.id}-detail`)) {
			this.map.setLayoutProperty(`${this.id}-detail`, 'visibility', 'none');
		}
	}

	autoStretch() {
		const rendered = this.detail || this.overview;
		if (!rendered) {
			return;
		}
		const indices = this.style.mode === 'rgb' ? this.style.rgb : [this.style.band];
		const ranges = this.style.ranges.slice();
		for (const i of indices) {
			ranges[i] = percentileRange(rendered.grid[i]) || ranges[i];
		}
		this.style = { ...this.style, ranges };
	}

	async restyle() {
		const needsRead = !this.readAll;
		if (needsRead) {
			return this.refresh();
		}
		if (this.overview) {
			this.ensureRanges(this.overview.grid);
			this.setImage('overview', this.overview, await this.toUrl(this.overview));
		}
		if (this.detail) {
			this.setImage('detail', this.detail, await this.toUrl(this.detail));
		}
	}

	async refresh() {
		await this.renderOverview();
		await this.renderDetail();
	}

	setVisibility(visible) {
		this.visible = visible;
		for (const id of this.layerIds) {
			if (this.map.getLayer(id)) {
				const show = visible && (id.endsWith('overview') || Boolean(this.detail));
				this.map.setLayoutProperty(id, 'visibility', show ? 'visible' : 'none');
			}
		}
	}

	setOpacity(opacity) {
		this.opacity = opacity;
		this.layerIds.forEach(id => this.map.getLayer(id) && this.map.setPaintProperty(id, 'raster-opacity', opacity));
	}

	gridValue(rendered, mx, my) {
		if (!rendered) {
			return null;
		}
		const [x0, y0, x1, y1] = rendered.bbox;
		if (mx < x0 || mx >= x1 || my <= y0 || my > y1) {
			return null;
		}
		const col = Math.floor((mx - x0) / (x1 - x0) * rendered.width);
		const row = Math.floor((y1 - my) / (y1 - y0) * rendered.height);
		const i = row * rendered.width + col;
		return rendered.grid.map(band => band[i]);
	}

	// Approximate values from the rendered grids, fast enough for pointer moves
	valueAt(lngLat) {
		const [mx, my] = getTransformer(WGS84, WEB_MERCATOR).forward([lngLat.lng, lngLat.lat]);
		const values = this.gridValue(this.detail, mx, my) || this.gridValue(this.overview, mx, my);
		if (!values) {
			return null;
		}
		const indices = this.readAll ? values.map((_, i) => i) : this.neededBands();
		return indices.map(i => ({ name: this.source.bands[i].name, value: values[i] }));
	}

	// Exact values at full resolution for all times
	async seriesAt(lngLat) {
		const [x, y] = getTransformer(WGS84, this.source.crs).forward([lngLat.lng, lngLat.lat]);
		return await this.source.readPixel(x, y, this.extra);
	}

	remove() {
		this.overviewToken++;
		this.detailToken++;
		for (const id of this.layerIds) {
			if (this.map.getLayer(id)) {
				this.map.removeLayer(id);
			}
			if (this.map.getSource(id)) {
				this.map.removeSource(id);
			}
		}
		Object.values(this.urls).forEach(url => URL.revokeObjectURL(url));
		this.urls = {};
	}

}
