import { looksLikeDate } from './time';

const FEATURE_COLUMNS = /^(feature_index|feature_id|feature|geometry_index|polygon|id|fid|index|name|label|station)$/i;
const TIME_COLUMNS = /^(t|time|date|datetime|timestamp)$/i;

export default class TableData {

	constructor(columns, rows) {
		this.columns = columns;
		// Array of arrays
		this.rows = rows;
	}

	static fromObjects(objects, columns = null) {
		if (!columns) {
			const set = new Set();
			objects.forEach(o => Object.keys(o || {}).forEach(k => set.add(k)));
			columns = Array.from(set);
		}
		return new TableData(columns, objects.map(o => columns.map(c => normalize(o ? o[c] : null))));
	}

	get size() {
		return this.rows.length;
	}

	column(name) {
		const i = this.columns.indexOf(name);
		return i < 0 ? [] : this.rows.map(r => r[i]);
	}

	numericColumns() {
		return this.columns.filter((c, i) => {
			let numbers = 0;
			for (const r of this.rows.slice(0, 500)) {
				const v = r[i];
				if (typeof v === 'number') {
					numbers++;
				}
				else if (v !== null && v !== '' && typeof v !== 'undefined') {
					return false;
				}
			}
			return numbers > 0;
		});
	}

	timeColumn() {
		const named = this.columns.find(c => TIME_COLUMNS.test(c));
		if (named) {
			return named;
		}
		return this.columns.find((c, i) => this.rows.length > 0 && this.rows.slice(0, 20).every(r => looksLikeDate(r[i])));
	}

	// Detects time series in long or wide format and returns chart datasets, or null
	toChart() {
		const time = this.timeColumn();
		if (!time || this.rows.length < 2) {
			return null;
		}
		const ti = this.columns.indexOf(time);
		const groupCol = this.columns.find(c => c !== time && FEATURE_COLUMNS.test(c));
		const gi = groupCol ? this.columns.indexOf(groupCol) : -1;
		const valueCols = this.numericColumns().filter(c => c !== time && c !== groupCol && !/^(x|y|lon|lat|longitude|latitude)$/i.test(c));
		if (valueCols.length === 0) {
			return null;
		}
		const series = new Map();
		for (const row of this.rows) {
			const t = row[ti] instanceof Date ? row[ti].toISOString() : String(row[ti]);
			for (const c of valueCols) {
				const label = gi >= 0 ? `${c} (${groupCol} ${row[gi]})` : c;
				if (!series.has(label)) {
					series.set(label, []);
				}
				const v = row[this.columns.indexOf(c)];
				series.get(label).push({ x: t, y: typeof v === 'number' && Number.isFinite(v) ? v : null });
			}
		}
		const datasets = Array.from(series.entries()).map(([label, data]) => ({ label, data: data.sort((a, b) => a.x < b.x ? -1 : 1) }));
		return { datasets, timeAxis: true };
	}

}

function normalize(v) {
	if (typeof v === 'bigint') {
		return Number(v);
	}
	if (v instanceof Date) {
		return v.toISOString();
	}
	if (v && typeof v === 'object' && !Array.isArray(v)) {
		return JSON.stringify(v);
	}
	return v;
}
