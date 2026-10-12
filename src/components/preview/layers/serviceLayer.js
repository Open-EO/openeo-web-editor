import maplibregl from 'maplibre-gl';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import Utils from '../../../utils';

let counter = 0;
const capabilitiesCache = new Map();
const wmtsLayers = new Map();
let protocolRegistered = false;

// MapLibre only knows {z}/{x}/{y}, so WMTS tiles go through a custom protocol that maps to the matrix identifiers
function registerProtocol() {
	if (protocolRegistered) {
		return;
	}
	protocolRegistered = true;
	maplibregl.addProtocol('openeo-wmts', async (params, abortController) => {
		const [, key, time, z, x, y] = params.url.match(/^openeo-wmts:\/\/([^/]+)\/([^/]*)\/(\d+)\/(\d+)\/(\d+)$/);
		const layer = wmtsLayers.get(key);
		const matrix = layer.matrices[Number(z)];
		if (!matrix) {
			return { data: new ArrayBuffer(0) };
		}
		const url = layer.template
			.replace(/\{TileMatrixSet\}/gi, layer.matrixSet)
			.replace(/\{TileMatrix\}/gi, matrix)
			.replace(/\{TileRow\}/gi, y)
			.replace(/\{TileCol\}/gi, x)
			.replace(/\{Style\}/gi, layer.style)
			.replace(/\{Time\}/gi, decodeURIComponent(time));
		const response = await fetch(url, { signal: abortController.signal });
		if (!response.ok) {
			throw new Error(`Tile request failed with status ${response.status}`);
		}
		return { data: await response.arrayBuffer() };
	});
}

async function getCapabilities(url) {
	if (!capabilitiesCache.has(url)) {
		const u = new URL(url);
		u.searchParams.set('service', 'wmts');
		u.searchParams.set('request', 'GetCapabilities');
		const response = await Utils.axios().get(u.toString(), { responseType: 'text' });
		capabilitiesCache.set(url, new WMTSCapabilities().read(response.data));
	}
	return capabilitiesCache.get(url);
}

function isWebMercator(crs) {
	return /(3857|900913|3785|102100|GoogleMapsCompatible)/i.test(String(crs));
}

export default class ServiceLayer {

	constructor(map, service, title = null) {
		this.id = `service-${++counter}`;
		this.kind = 'service';
		this.map = map;
		this.service = service;
		const previewId = typeof service.id === 'string' && service.id.startsWith('collection-preview~') ? service.id.slice(19) : null;
		this.title = title || service.title || previewId || Utils.getResourceTitle(service, 'Service');
		this.visible = true;
		this.opacity = 1;
		this.loading = 0;
		this.times = null;
		this.time = null;
		this.sources = [];
		this.onChange = null;
		this.bbox = null;
	}

	get layerIds() {
		return this.sources.map(s => s.id);
	}

	get bounds() {
		return this.bbox ? [[this.bbox[0], this.bbox[1]], [this.bbox[2], this.bbox[3]]] : null;
	}

	get extent() {
		return this.bbox;
	}

	async refresh() {
		if (this.sources.length > 0) {
			return;
		}
		const type = String(this.service.type).toLowerCase();
		if (type === 'xyz') {
			const url = Utils.replaceParam(this.service.url, '__editorSessionId', Date.now()).replace(/%7B/g, '{').replace(/%7D/g, '}');
			this.addRaster({ tiles: [url], tileSize: 256 });
		}
		else if (type === 'wmts') {
			await this.addWmts();
		}
		else {
			throw new Error(`Sorry, the web service type '${this.service.type}' is not supported.`);
		}
		this.bbox = this.detectBbox();
	}

	addRaster({ key = null, ...source }) {
		const id = `${this.id}-${this.sources.length}`;
		this.map.addSource(id, { type: 'raster', ...source });
		this.map.addLayer({ id, type: 'raster', source: id, paint: { 'raster-opacity': this.opacity } });
		this.sources.push({ id, key });
	}

	async addWmts() {
		registerProtocol();
		const caps = await getCapabilities(this.service.url);
		const attrs = this.service.attributes || {};
		const available = (caps.Contents && caps.Contents.Layer) || [];
		const names = Array.isArray(attrs.layers) && attrs.layers.length ? attrs.layers : available.map(l => l.Identifier);
		for (const name of names) {
			const layer = available.find(l => l.Identifier === name);
			if (!layer) {
				continue;
			}
			const links = layer.TileMatrixSetLink || [];
			const sets = (caps.Contents.TileMatrixSet || []).filter(s => links.some(l => l.TileMatrixSet === s.Identifier));
			const set = sets.find(s => isWebMercator(s.SupportedCRS) || isWebMercator(s.Identifier));
			if (!set) {
				throw new Error(`WMTS layer '${name}' is not available in Web Mercator.`);
			}
			const style = (layer.Style || []).find(s => s.isDefault) || (layer.Style || [])[0];
			const resource = (layer.ResourceURL || []).find(r => r.resourceType === 'tile');
			let template;
			if (resource) {
				template = resource.template;
			}
			else {
				const op = caps.OperationsMetadata && caps.OperationsMetadata.GetTile;
				const base = op ? op.DCP.HTTP.Get[0].href : this.service.url;
				const u = new URL(base);
				Object.entries({ service: 'WMTS', request: 'GetTile', version: '1.0.0', layer: name, style: '{Style}', format: (layer.Format || ['image/png'])[0], tilematrixset: '{TileMatrixSet}', tilematrix: '{TileMatrix}', tilerow: '{TileRow}', tilecol: '{TileCol}' })
					.forEach(([k, v]) => u.searchParams.set(k, v));
				template = decodeURIComponent(u.toString());
			}
			const dims = Object.assign({}, ...((layer.Dimension || []).map(d => ({ [d.Identifier]: d.Default }))), attrs.dimensions || {});
			Object.entries(dims).forEach(([k, v]) => {
				if (k.toUpperCase() !== 'TIME') {
					template = template.replace(new RegExp(`\\{${k}\\}`, 'gi'), v);
				}
			});
			const timeDim = (layer.Dimension || []).find(d => d.Identifier.toUpperCase() === 'TIME');
			if (timeDim && Array.isArray(timeDim.Value)) {
				this.times = timeDim.Value.slice().sort();
				this.time = dims.TIME || dims.time || timeDim.Default || this.times[this.times.length - 1];
			}
			if (!/\{time\}/i.test(template) && this.time) {
				const u = new URL(template.replace(/\{/g, '%7B').replace(/\}/g, '%7D'));
				u.searchParams.set('TIME', '{Time}');
				template = decodeURIComponent(u.toString());
			}
			const key = `${this.id}-${name}`;
			wmtsLayers.set(key, {
				template,
				matrixSet: set.Identifier,
				matrices: set.TileMatrix.map(m => m.Identifier),
				style: style ? style.Identifier : 'default'
			});
			const wgs = layer.WGS84BoundingBox;
			this.addRaster({ tiles: [this.tileUrl(key)], tileSize: 256, maxzoom: set.TileMatrix.length - 1, bounds: wgs || undefined, key });
			if (wgs && !this.bbox) {
				this.bbox = wgs;
			}
		}
	}

	// The time is part of the tile URL so that tiles of other times aren't served from the cache
	tileUrl(key) {
		return `openeo-wmts://${key}/${encodeURIComponent(this.time || '')}/{z}/{x}/{y}`;
	}

	setTime(time) {
		this.time = time;
		for (const { id, key } of this.sources) {
			const source = this.map.getSource(id);
			if (source && key) {
				source.setTiles([this.tileUrl(key)]);
			}
		}
	}

	detectBbox() {
		const attrs = this.service.attributes || {};
		if (Utils.isObject(attrs.bbox)) {
			const b = attrs.bbox;
			return [b.west, b.south, b.east, b.north];
		}
		const process = this.service.process;
		if (Utils.isObject(process) && Utils.isObject(process.process_graph)) {
			for (const node of Object.values(process.process_graph)) {
				const e = node.process_id === 'load_collection' && Utils.isObject(node.arguments) ? node.arguments.spatial_extent : null;
				if (Utils.isObject(e) && [e.west, e.south, e.east, e.north].every(Number.isFinite) && (!e.crs || e.crs === 4326 || e.crs === 'EPSG:4326')) {
					return [e.west, e.south, e.east, e.north];
				}
			}
		}
		return this.bbox;
	}

	async restyle() {}

	setVisibility(visible) {
		this.visible = visible;
		this.layerIds.forEach(id => this.map.getLayer(id) && this.map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none'));
	}

	setOpacity(opacity) {
		this.opacity = opacity;
		this.layerIds.forEach(id => this.map.getLayer(id) && this.map.setPaintProperty(id, 'raster-opacity', opacity));
	}

	remove() {
		this.layerIds.forEach(id => {
			if (this.map.getLayer(id)) {
				this.map.removeLayer(id);
			}
			if (this.map.getSource(id)) {
				this.map.removeSource(id);
			}
		});
		for (const key of Array.from(wmtsLayers.keys())) {
			if (key.startsWith(`${this.id}-`)) {
				wmtsLayers.delete(key);
			}
		}
	}

}
