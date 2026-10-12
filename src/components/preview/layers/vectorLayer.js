import { expressionStops } from '../../../data/colormaps';

let counter = 0;
const PALETTE = ['#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6', '#dd4477', '#66aa00'];

const isPolygon = ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false];
const isLine = ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false];
const isPoint = ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false];

export default class VectorLayer {

	constructor(map, vector, title = null) {
		this.id = `vector-${++counter}`;
		this.kind = 'vector';
		this.map = map;
		this.vector = vector;
		this.title = title || vector.title || 'Vector';
		this.visible = true;
		this.opacity = 1;
		this.loading = 0;
		this.color = PALETTE[(counter - 1) % PALETTE.length];
		this.style = { colorBy: null, colormap: 'viridis', reverse: false, range: null };
		this.onChange = null;
	}

	get layerIds() {
		return [`${this.id}-fill`, `${this.id}-line`, `${this.id}-circle`];
	}

	get bounds() {
		const b = this.vector.bbox;
		return b ? [[b[0], b[1]], [b[2], b[3]]] : null;
	}

	get extent() {
		return this.vector.bbox;
	}

	async refresh() {
		if (this.map.getSource(this.id)) {
			return;
		}
		// Feature ids are needed for hover/selection, so assign them explicitly
		const features = this.vector.features.map((f, i) => ({ ...f, id: i }));
		this.map.addSource(this.id, { type: 'geojson', data: { type: 'FeatureCollection', features } });
		const color = this.colorExpression();
		this.map.addLayer({ id: `${this.id}-fill`, type: 'fill', source: this.id, filter: isPolygon, paint: { 'fill-color': color, 'fill-opacity': 0.45 * this.opacity } });
		this.map.addLayer({ id: `${this.id}-line`, type: 'line', source: this.id, filter: ['any', isPolygon, isLine], paint: { 'line-color': this.style.colorBy ? color : this.color, 'line-width': 1.5, 'line-opacity': this.opacity } });
		this.map.addLayer({ id: `${this.id}-circle`, type: 'circle', source: this.id, filter: isPoint, paint: {
			'circle-color': color,
			'circle-radius': features.length > 5000
				? ['interpolate', ['linear'], ['zoom'], 2, 0.75, 8, 1.5, 14, 4]
				: ['interpolate', ['linear'], ['zoom'], 2, 3, 12, 6],
			'circle-stroke-color': '#fff',
			'circle-stroke-width': features.length > 5000 ? 0 : 1,
			'circle-opacity': this.opacity
		} });
	}

	colorExpression() {
		const { colorBy, colormap, reverse } = this.style;
		if (!colorBy) {
			return this.color;
		}
		const values = this.vector.features.map(f => f.properties && f.properties[colorBy]).filter(v => typeof v === 'number' && Number.isFinite(v));
		if (values.length === 0) {
			return this.color;
		}
		if (!this.style.range) {
			this.style.range = [Math.min(...values), Math.max(...values)];
		}
		const [min, max] = this.style.range;
		return ['case',
			['==', ['typeof', ['get', colorBy]], 'number'],
			['interpolate', ['linear'], ['get', colorBy], ...expressionStops(colormap, min, max, reverse)],
			'#999999'
		];
	}

	async restyle() {
		const color = this.colorExpression();
		this.map.setPaintProperty(`${this.id}-fill`, 'fill-color', color);
		this.map.setPaintProperty(`${this.id}-circle`, 'circle-color', color);
		this.map.setPaintProperty(`${this.id}-line`, 'line-color', this.style.colorBy ? color : this.color);
	}

	setVisibility(visible) {
		this.visible = visible;
		this.layerIds.forEach(id => this.map.getLayer(id) && this.map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none'));
	}

	setOpacity(opacity) {
		this.opacity = opacity;
		this.map.setPaintProperty(`${this.id}-fill`, 'fill-opacity', 0.45 * opacity);
		this.map.setPaintProperty(`${this.id}-line`, 'line-opacity', opacity);
		this.map.setPaintProperty(`${this.id}-circle`, 'circle-opacity', opacity);
	}

	numericProperties() {
		return this.vector.numericProperties();
	}

	remove() {
		this.layerIds.forEach(id => this.map.getLayer(id) && this.map.removeLayer(id));
		if (this.map.getSource(this.id)) {
			this.map.removeSource(this.id);
		}
	}

}
