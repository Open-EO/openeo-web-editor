<template>
	<div class="preview-map" @dragover.prevent @drop.prevent.stop="onDrop">
		<div ref="map" class="pm-map"></div>

		<div class="pm-panel pm-layers">
			<div class="pm-head">
				<strong>Layers</strong>
				<span class="pm-actions">
					<button type="button" @click="openLocal" title="Open local file(s)"><i class="fas fa-file-import"></i></button>
					<button type="button" @click="openDirectory" title="Open local folder, e.g. a Zarr store"><i class="fas fa-folder-open"></i></button>
					<button type="button" @click="openUrl" title="Add data from URL"><i class="fas fa-link"></i></button>
					<button type="button" @click="toggleGlobe" :class="{ toggled: globe }" title="Toggle globe view"><i class="fas fa-globe"></i></button>
					<button type="button" @click="collapsed = !collapsed" :title="collapsed ? 'Expand' : 'Collapse'"><i :class="['fas', collapsed ? 'fa-chevron-down' : 'fa-chevron-up']"></i></button>
				</span>
			</div>
			<template v-if="!collapsed">
				<ul class="pm-layer-list">
					<li v-for="layer in reversedViews" :key="layer.id" :class="{ active: layer.id === activeId }">
						<div class="pm-row">
							<input type="checkbox" :checked="layer.visible" @change="setVisible(layer.id, $event.target.checked)" title="Show / hide" />
							<i :class="['fas', layerIcon(layer)]"></i>
							<span class="pm-title" @click="activeId = layer.id" :title="layer.title">{{ layer.title }}</span>
							<i v-if="layer.loading" class="fas fa-spinner fa-spin"></i>
							<button type="button" @click="zoomTo(layer.id)" title="Zoom to layer"><i class="fas fa-search-plus"></i></button>
							<button type="button" @click="removeLayer(layer.id)" title="Remove layer"><i class="fas fa-times"></i></button>
						</div>
						<input v-if="layer.id === activeId" type="range" min="0" max="1" step="0.05" :value="layer.opacity" @input="setOpacity(layer.id, $event.target.value)" title="Opacity" />
					</li>
					<li v-if="layerViews.length === 0" class="pm-empty">No layers yet. Drop files here or use the buttons above.</li>
				</ul>
				<label class="pm-basemap">
					<span>Basemap</span>
					<select v-model.number="basemap">
						<option v-for="(b, i) in basemaps" :key="i" :value="i">{{ b.title }}</option>
						<option :value="-1">None</option>
					</select>
				</label>
				<div v-if="activeView && activeView.kind === 'raster'" class="pm-style">
					<RasterStyle :value="activeView.style" :bands="activeView.bands" :hasPalette="activeView.hasPalette" @input="applyStyle" @auto="autoStretch" />
				</div>
				<div v-else-if="activeView && activeView.kind === 'vector'" class="pm-style">
					<label class="pm-inline">
						<span>Color by</span>
						<select :value="activeView.style.colorBy || ''" @change="applyVectorStyle({ colorBy: $event.target.value || null, range: null })">
							<option value="">— single color —</option>
							<option v-for="p in activeView.numeric" :key="p" :value="p">{{ p }}</option>
						</select>
					</label>
					<template v-if="activeView.style.colorBy">
						<label class="pm-inline">
							<span>Colors</span>
							<select :value="activeView.style.colormap" @change="applyVectorStyle({ colormap: $event.target.value })">
								<option v-for="name in colormaps" :key="name" :value="name">{{ name }}</option>
							</select>
						</label>
						<div class="pm-legend" :style="{ background: gradient(activeView.style) }"></div>
						<div class="pm-legend-labels" v-if="activeView.style.range"><span>{{ fmt(activeView.style.range[0]) }}</span><span>{{ fmt(activeView.style.range[1]) }}</span></div>
					</template>
					<div class="pm-hint">{{ activeView.count.toLocaleString() }} features. Click a feature for details.</div>
				</div>
			</template>
		</div>

		<div v-if="timeView" class="pm-panel pm-time">
			<template v-if="timeView.times && timeView.times.length > 1">
				<button type="button" @click="stepTime(-1)" :disabled="timeView.time <= 0" title="Previous"><i class="fas fa-step-backward"></i></button>
				<input type="range" min="0" :max="timeView.times.length - 1" :value="timeView.time" @change="setTime(Number($event.target.value))" @input="timePreview = Number($event.target.value)" />
				<button type="button" @click="stepTime(1)" :disabled="timeView.time >= timeView.times.length - 1" title="Next"><i class="fas fa-step-forward"></i></button>
				<span class="pm-time-label">{{ formatTime(timeView.times[timePreview !== null ? timePreview : timeView.time]) }}</span>
			</template>
			<template v-else-if="timeView.serviceTimes">
				<span>Date</span>
				<select :value="timeView.serviceTime" @change="setServiceTime($event.target.value)">
					<option v-for="t in timeView.serviceTimes" :key="t" :value="t">{{ formatTime(t) }}</option>
				</select>
			</template>
			<label v-for="dim in timeView.extraDims || []" :key="dim.name" class="pm-inline">
				<span>{{ dim.name }}</span>
				<select :value="timeView.extra[dim.name]" @change="setExtra(dim.name, Number($event.target.value))">
					<option v-for="(v, i) in dim.values" :key="i" :value="i">{{ v }}</option>
				</select>
			</label>
		</div>

		<div class="pm-readout" v-if="readout">{{ readout }}</div>
		<div class="pm-busy" v-if="busy"><i class="fas fa-spinner fa-spin"></i> {{ busy }}</div>

		<div class="pm-chart" v-if="chart">
			<button type="button" class="pm-close" @click="chart = null" title="Close"><i class="fas fa-times"></i></button>
			<div v-if="chart.loading" class="pm-hint">Reading values...</div>
			<div v-else-if="chart.datasets.length === 0" class="pm-hint">No data at this location.</div>
			<PreviewChart v-else v-bind="chart" :height="190" />
		</div>
	</div>
</template>

<script>
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { markRaw } from 'vue';
import { Service } from '@openeo/js-client';

import EventBusMixin from '../EventBusMixin';
import Utils from '../../utils';
import RasterStyle from './RasterStyle.vue';
import PreviewChart from './PreviewChart.vue';
import RasterLayer from './layers/rasterLayer';
import VectorLayer from './layers/vectorLayer';
import ServiceLayer from './layers/serviceLayer';
import DataFile from '../../formats/dataFile';
import { COLORMAPS, cssGradient } from '../../data/colormaps';
import { formatTime } from '../../data/time';
import { chooseDirectory, chooseFiles, inputsFromDrop } from '../../platform';

function escapeHtml(s) {
	return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmt(v) {
	if (typeof v !== 'number') {
		return v === null || typeof v === 'undefined' ? '' : String(v);
	}
	if (Number.isNaN(v)) {
		return 'no data';
	}
	return Number.isInteger(v) ? String(v) : String(parseFloat(v.toPrecision(6)));
}

export default {
	name: 'PreviewMap',
	mixins: [EventBusMixin],
	components: {
		PreviewChart,
		RasterStyle
	},
	props: {
		dataset: {
			type: Object,
			default: null
		},
		service: {
			type: Object,
			default: null
		}
	},
	data() {
		return {
			layerViews: [],
			activeId: null,
			basemap: 0,
			collapsed: false,
			readout: null,
			busy: 'Loading map...',
			chart: null,
			globe: false,
			timePreview: null,
			colormaps: COLORMAPS
		};
	},
	computed: {
		...Utils.mapState(['connection']),
		...Utils.mapState('editor', ['formatRegistry']),
		basemaps() {
			return Array.isArray(this.$config.basemaps) ? this.$config.basemaps : [];
		},
		reversedViews() {
			return this.layerViews.slice().reverse();
		},
		activeView() {
			return this.layerViews.find(v => v.id === this.activeId) || null;
		},
		timeView() {
			const candidates = [this.activeView, ...this.reversedViews].filter(v => v && v.visible);
			return candidates.find(v => (v.times && v.times.length > 1) || (v.extraDims && v.extraDims.length > 0) || v.serviceTimes) || null;
		}
	},
	watch: {
		basemap(value) {
			this.basemaps.forEach((_, i) => {
				if (this.map.getLayer(`basemap-${i}`)) {
					this.map.setLayoutProperty(`basemap-${i}`, 'visibility', i === value ? 'visible' : 'none');
				}
			});
		}
	},
	created() {
		// Not reactive on purpose: MapLibre and the layer controllers must not be observed by Vue
		this.map = null;
		this.layers = new Map();
		this.detailTimer = null;
		this.readoutFrame = null;
		this.popup = null;
		// Files that were added to this map later on and must be released with it
		this.addedFiles = [];
	},
	mounted() {
		this.createMap();
		this.resizeObserver = new ResizeObserver(() => this.map && this.map.resize());
		this.resizeObserver.observe(this.$el);
		this.$emit('mounted', this);
	},
	beforeDestroy() {
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
		}
		clearTimeout(this.detailTimer);
		for (const layer of this.layers.values()) {
			layer.remove();
		}
		this.layers.clear();
		this.addedFiles.forEach(file => file.unload());
		if (this.map) {
			this.map.remove();
			this.map = null;
		}
	},
	methods: {
		fmt,
		formatTime,
		gradient(style) {
			return cssGradient(style.colormap, style.reverse);
		},
		layerIcon(view) {
			return { raster: 'fa-th', vector: 'fa-draw-polygon', service: 'fa-globe-europe' }[view.kind] || 'fa-layer-group';
		},
		createMap() {
			const sources = {};
			const layers = [];
			this.basemaps.forEach((b, i) => {
				const urls = /\{a-c\}/.test(b.url) ? ['a', 'b', 'c'].map(s => b.url.replace('{a-c}', s)) : [b.url];
				sources[`basemap-${i}`] = { type: 'raster', tiles: urls, tileSize: 256, maxzoom: b.maxZoom || 19, attribution: b.attributions || '' };
				layers.push({ id: `basemap-${i}`, type: 'raster', source: `basemap-${i}`, layout: { visibility: i === 0 ? 'visible' : 'none' } });
			});
			this.map = markRaw(new maplibregl.Map({
				container: this.$refs.map,
				style: { version: 8, sources, layers },
				center: [10, 30],
				zoom: 1,
				attributionControl: { compact: true },
				preserveDrawingBuffer: false
			}));
			this.map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');
			this.map.addControl(new maplibregl.ScaleControl(), 'bottom-right');
			this.map.on('load', () => this.onLoad());
			this.map.on('moveend', () => this.scheduleDetail());
			this.map.on('mousemove', e => this.onPointerMove(e));
			this.map.on('mouseout', () => this.readout = null);
			this.map.on('click', e => this.onClick(e));
			this.map.on('error', e => console.warn(e && e.error ? e.error : e));
		},
		async onLoad() {
			this.busy = null;
			try {
				if (this.dataset) {
					await this.addDataset(this.dataset);
				}
				if (this.service instanceof Service) {
					await this.addController(new ServiceLayer(this.map, this.service));
				}
				this.fitAll();
			} catch (error) {
				Utils.exception(this, error);
			}
		},
		async addDataset(ds) {
			const added = [];
			for (const source of ds.rasters.filter(r => r.isGeoreferenced())) {
				added.push(await this.addController(new RasterLayer(this.map, source, source.title || ds.title)));
			}
			for (const vector of ds.vectors) {
				added.push(await this.addController(new VectorLayer(this.map, vector, vector.title || ds.title)));
			}
			const skipped = ds.rasters.filter(r => !r.isGeoreferenced()).length;
			if (skipped > 0) {
				Utils.info(this, `${skipped} raster(s) without georeferencing can't be shown on the map.`);
			}
			return added.filter(Boolean);
		},
		async addController(controller) {
			const layer = markRaw(controller);
			layer.onChange = l => this.syncView(l);
			this.layers.set(layer.id, layer);
			this.layerViews.push(this.makeView(layer));
			if (!this.activeId || layer.kind !== 'service') {
				this.activeId = layer.id;
			}
			try {
				await layer.refresh();
				this.syncView(layer);
				return layer;
			} catch (error) {
				Utils.exception(this, error, `Failed to show '${layer.title}'`);
				this.removeLayer(layer.id);
				return null;
			}
		},
		makeView(layer) {
			const view = {
				id: layer.id,
				kind: layer.kind,
				title: layer.title,
				visible: layer.visible,
				opacity: layer.opacity,
				loading: layer.loading > 0
			};
			if (layer.kind === 'raster') {
				const s = layer.source;
				Object.assign(view, {
					bands: s.bands.map(b => b.name),
					hasPalette: Boolean(s.palette),
					style: JSON.parse(JSON.stringify(layer.style)),
					times: s.times,
					time: layer.time,
					extraDims: s.extraDims,
					extra: { ...layer.extra }
				});
			}
			else if (layer.kind === 'vector') {
				Object.assign(view, {
					style: { ...layer.style },
					numeric: layer.numericProperties(),
					count: layer.vector.features.length
				});
			}
			else if (layer.kind === 'service') {
				Object.assign(view, { serviceTimes: layer.times, serviceTime: layer.time });
			}
			return view;
		},
		syncView(layer) {
			const i = this.layerViews.findIndex(v => v.id === layer.id);
			if (i >= 0) {
				this.layerViews.splice(i, 1, this.makeView(layer));
			}
			const loading = this.layerViews.some(v => v.loading);
			if (!loading && this.busy === 'Rendering...') {
				this.busy = null;
			}
		},
		fitAll() {
			const bounds = Array.from(this.layers.values()).map(l => l.bounds).filter(Boolean);
			if (bounds.length === 0) {
				return;
			}
			const b = bounds.reduce((a, c) => [[Math.min(a[0][0], c[0][0]), Math.min(a[0][1], c[0][1])], [Math.max(a[1][0], c[1][0]), Math.max(a[1][1], c[1][1])]]);
			this.fitBounds(b);
		},
		fitBounds(b) {
			// -180 and 180 are the same meridian, which would collapse world-wide bounds
			const clamp = (v, lim) => Math.max(-lim, Math.min(lim, v));
			const bounds = [[clamp(b[0][0], 179.9), clamp(b[0][1], 85)], [clamp(b[1][0], 179.9), clamp(b[1][1], 85)]];
			if (bounds[0][0] === bounds[1][0] && bounds[0][1] === bounds[1][1]) {
				this.map.jumpTo({ center: bounds[0], zoom: 14 });
				return;
			}
			this.map.fitBounds(bounds, { padding: 30, maxZoom: 18, animate: false });
		},
		zoomTo(id) {
			const layer = this.layers.get(id);
			if (layer && layer.bounds) {
				this.fitBounds(layer.bounds);
			}
		},
		removeLayer(id) {
			const layer = this.layers.get(id);
			if (layer) {
				layer.remove();
				this.layers.delete(id);
			}
			this.layerViews = this.layerViews.filter(v => v.id !== id);
			if (this.activeId === id) {
				this.activeId = this.layerViews.length ? this.layerViews[this.layerViews.length - 1].id : null;
			}
		},
		setVisible(id, visible) {
			const layer = this.layers.get(id);
			layer.setVisibility(visible);
			if (visible && layer.kind === 'raster') {
				this.scheduleDetail();
			}
			this.syncView(layer);
		},
		setOpacity(id, value) {
			const layer = this.layers.get(id);
			layer.setOpacity(Number(value));
			this.syncView(layer);
		},
		async applyStyle(style) {
			const layer = this.layers.get(this.activeId);
			layer.style = style;
			await this.run(() => layer.restyle());
			this.syncView(layer);
		},
		async autoStretch() {
			const layer = this.layers.get(this.activeId);
			layer.autoStretch();
			await this.run(() => layer.restyle());
			this.syncView(layer);
		},
		async applyVectorStyle(changes) {
			const layer = this.layers.get(this.activeId);
			layer.style = Object.assign({}, layer.style, changes);
			await layer.restyle();
			this.syncView(layer);
		},
		async setTime(index) {
			this.timePreview = null;
			const layer = this.layers.get(this.timeView.id);
			layer.time = index;
			this.syncView(layer);
			await this.run(() => layer.refresh());
		},
		stepTime(delta) {
			this.setTime(this.timeView.time + delta);
		},
		setServiceTime(time) {
			const layer = this.layers.get(this.timeView.id);
			layer.setTime(time);
			this.syncView(layer);
		},
		async setExtra(dim, index) {
			const layer = this.layers.get(this.timeView.id);
			layer.extra = { ...layer.extra, [dim]: index };
			this.syncView(layer);
			await this.run(() => layer.refresh());
		},
		async run(fn) {
			try {
				await fn();
			} catch (error) {
				Utils.exception(this, error);
			}
		},
		scheduleDetail() {
			clearTimeout(this.detailTimer);
			this.detailTimer = setTimeout(() => {
				for (const layer of this.layers.values()) {
					if (layer.kind === 'raster' && layer.visible) {
						layer.renderDetail().catch(error => console.warn(error));
					}
				}
			}, 150);
		},
		visibleRasters() {
			return Array.from(this.layers.values()).filter(l => l.kind === 'raster' && l.visible).reverse();
		},
		onPointerMove(e) {
			if (this.readoutFrame) {
				return;
			}
			this.readoutFrame = requestAnimationFrame(() => {
				this.readoutFrame = null;
				const parts = [`${e.lngLat.lng.toFixed(5)}, ${e.lngLat.lat.toFixed(5)}`];
				const active = this.layers.get(this.activeId);
				const rasters = active && active.kind === 'raster' && active.visible ? [active] : this.visibleRasters().slice(0, 1);
				for (const layer of rasters) {
					const values = layer.valueAt(e.lngLat);
					if (values) {
						parts.push(values.slice(0, 8).map(v => `${v.name}: ${fmt(v.value)}`).join(' · ') + (values.length > 8 ? ' …' : ''));
					}
				}
				this.readout = parts.join('  |  ');
			});
		},
		onClick(e) {
			const vectorIds = Array.from(this.layers.values()).filter(l => l.kind === 'vector' && l.visible).flatMap(l => l.layerIds).filter(id => this.map.getLayer(id));
			const features = vectorIds.length ? this.map.queryRenderedFeatures(e.point, { layers: vectorIds }) : [];
			if (features.length > 0) {
				this.showPopup(e.lngLat, features[0]);
				return;
			}
			this.showSeries(e.lngLat);
		},
		showPopup(lngLat, feature) {
			const rows = Object.entries(feature.properties || {}).slice(0, 60)
				.map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(fmt(v))}</td></tr>`).join('');
			if (this.popup) {
				this.popup.remove();
			}
			this.popup = markRaw(new maplibregl.Popup({ maxWidth: '320px' })
				.setLngLat(lngLat)
				.setHTML(`<div class="pm-popup"><table>${rows || '<tr><td>No attributes</td></tr>'}</table></div>`)
				.addTo(this.map));
		},
		async showSeries(lngLat) {
			const rasters = this.visibleRasters();
			if (rasters.length === 0) {
				return;
			}
			this.chart = { loading: true, datasets: [] };
			try {
				const results = await Promise.all(rasters.map(async layer => ({ layer, series: await layer.seriesAt(lngLat) })));
				const withData = results.filter(r => r.series.length > 0 && r.series.some(s => s.values.some(Number.isFinite)));
				const title = `${lngLat.lng.toFixed(5)}, ${lngLat.lat.toFixed(5)}`;
				const temporal = withData.some(r => r.series.length > 1);
				let datasets;
				if (temporal) {
					datasets = withData.flatMap(({ layer, series }) => layer.source.bands.slice(0, 12).map((band, b) => ({
						label: withData.length > 1 ? `${layer.title}: ${band.name}` : band.name,
						data: series.filter(s => s.time).map(s => ({ x: s.time, y: Number.isFinite(s.values[b]) ? s.values[b] : null }))
					})));
				}
				else {
					datasets = withData.map(({ layer, series }) => ({
						label: layer.title,
						data: layer.source.bands.map((band, b) => ({ x: band.name, y: Number.isFinite(series[0].values[b]) ? series[0].values[b] : null }))
					}));
				}
				this.chart = { loading: false, title, datasets, timeAxis: temporal, xLabel: temporal ? 'Time' : 'Band' };
			} catch (error) {
				this.chart = null;
				Utils.exception(this, error, 'Reading values failed');
			}
		},
		toggleGlobe() {
			this.globe = !this.globe;
			this.map.setProjection({ type: this.globe ? 'globe' : 'mercator' });
		},
		async addInputs(inputs) {
			if (inputs.length === 0) {
				return;
			}
			await this.addFiles(this.formatRegistry.createFilesFromLocal(inputs));
		},
		async addFiles(files) {
			if (files.length > 5 && !Utils.confirmOpenAll(files)) {
				return;
			}
			this.busy = `Loading ${files.length > 1 ? files.length + ' files' : (files[0].title || 'data')}...`;
			const added = [];
			try {
				for (const file of files) {
					try {
						await this.addFile(file, false).then(layers => added.push(...layers));
					} catch (error) {
						Utils.exception(this, error, `Can't add ${file.title || file.href || 'file'}`);
					}
				}
			} finally {
				this.busy = null;
			}
			const bounds = added.map(l => l.bounds).filter(Boolean);
			if (bounds.length) {
				this.fitBounds(bounds.reduce((a, c) => [[Math.min(a[0][0], c[0][0]), Math.min(a[0][1], c[0][1])], [Math.max(a[1][0], c[1][0]), Math.max(a[1][1], c[1][1])]]));
			}
		},
		// Also used by the viewer to add data to an existing map
		async addFile(file, fit = true) {
			if (!(file instanceof DataFile)) {
				throw new Error('Only geospatial data can be added to the map.');
			}
			const ds = await file.loadData(this.connection);
			this.addedFiles.push(file);
			if (!ds.hasMap) {
				throw new Error(`'${file.getFileName()}' doesn't contain data that can be shown on a map.`);
			}
			const layers = await this.addDataset(ds);
			if (fit && layers.length) {
				this.zoomTo(layers[0].id);
			}
			return layers;
		},
		async openLocal() {
			await this.addInputs(await chooseFiles());
		},
		async openDirectory() {
			await this.addInputs(await chooseDirectory());
		},
		openUrl() {
			this.broadcast('showModal', 'AddMapDataModal', {}, { save: files => this.addFiles(files) });
		},
		async onDrop(event) {
			const inputs = await inputsFromDrop(event.dataTransfer);
			await this.addInputs(inputs);
		},
		onShow() {
			if (this.map) {
				this.map.resize();
			}
		},
		onHide() {}
	}
};
</script>

<style lang="scss">
.preview-map {
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;

	.pm-map {
		position: absolute;
		inset: 0;
	}

	.pm-panel {
		position: absolute;
		z-index: 2;
		background: rgba(255, 255, 255, 0.95);
		border-radius: 4px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
		padding: 0.4em 0.5em;
		font-size: 0.85em;
		color: #222;
	}

	.pm-layers {
		top: 10px;
		left: 10px;
		width: 18em;
		max-width: calc(100% - 80px);
		max-height: calc(100% - 90px);
		overflow-y: auto;
	}

	.pm-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
	}

	button {
		cursor: pointer;
	}

	.pm-actions button, .pm-row button {
		border: 0;
		background: transparent;
		padding: 0.15em 0.3em;
		color: #444;

		&:hover {
			color: #000;
		}

		&.toggled {
			color: #1565c0;
		}
	}

	.pm-layer-list {
		list-style: none;
		padding: 0;
		margin: 0.4em 0;

		li {
			padding: 0.2em 0.25em;
			border-radius: 3px;

			&.active {
				background: #e8f0fe;
			}

			input[type=range] {
				width: 100%;
			}
		}

		.pm-empty {
			color: #666;
			font-style: italic;
		}
	}

	.pm-row {
		display: flex;
		align-items: center;
		gap: 0.3em;

		.pm-title {
			flex: 1;
			cursor: pointer;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	.pm-basemap, .pm-inline {
		display: flex;
		align-items: center;
		gap: 0.4em;

		> span {
			min-width: 3.5em;
		}

		select {
			flex: 1;
			min-width: 0;
		}
	}

	.pm-style {
		border-top: 1px solid #ddd;
		margin-top: 0.5em;
		padding-top: 0.5em;
		display: flex;
		flex-direction: column;
		gap: 0.35em;
	}

	.pm-legend {
		height: 0.8em;
		border-radius: 2px;
	}

	.pm-legend-labels {
		display: flex;
		justify-content: space-between;
	}

	.pm-hint {
		color: #666;
		padding: 0.25em 0;
	}

	.pm-time {
		bottom: 34px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 0.4em;
		max-width: calc(100% - 40px);
		flex-wrap: wrap;
		justify-content: center;

		input[type=range] {
			width: 14em;
			max-width: 40vw;
		}

		.pm-time-label {
			font-variant-numeric: tabular-nums;
			min-width: 7em;
		}
	}

	.pm-readout {
		position: absolute;
		left: 10px;
		bottom: 8px;
		z-index: 2;
		background: rgba(255, 255, 255, 0.85);
		padding: 0.15em 0.5em;
		border-radius: 3px;
		font-size: 0.8em;
		max-width: calc(100% - 200px);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-variant-numeric: tabular-nums;
	}

	.pm-busy {
		position: absolute;
		top: 10px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 3;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 0.4em 0.9em;
		border-radius: 4px;
	}

	.pm-chart {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 220px;
		z-index: 3;
		background: white;
		border-top: 1px solid #ccc;
		box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.15);

		.pm-close {
			position: absolute;
			right: 0.4em;
			top: 0.3em;
			z-index: 1;
			border: 0;
			background: transparent;
		}

		.pm-hint {
			padding: 1em;
		}
	}
}

.pm-popup {
	max-height: 260px;
	overflow: auto;

	table {
		border-collapse: collapse;
		font-size: 0.85em;
	}

	th {
		text-align: left;
		padding-right: 0.8em;
		white-space: nowrap;
		vertical-align: top;
	}

	td {
		word-break: break-word;
	}
}
</style>
