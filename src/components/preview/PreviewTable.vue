<template>
	<div class="preview-table">
		<div class="pt-toolbar">
			<span>{{ table.size.toLocaleString() }} rows, {{ table.columns.length }} columns</span>
			<input type="search" v-model="filter" placeholder="Filter..." />
			<span class="pt-pages" v-if="pageCount > 1">
				<button type="button" :disabled="page === 0" @click="page--" title="Previous page"><i class="fas fa-chevron-left"></i></button>
				{{ page + 1 }} / {{ pageCount }}
				<button type="button" :disabled="page >= pageCount - 1" @click="page++" title="Next page"><i class="fas fa-chevron-right"></i></button>
			</span>
			<button type="button" @click="downloadCsv" title="Download as CSV"><i class="fas fa-download"></i> CSV</button>
		</div>
		<div class="pt-scroll">
			<table>
				<thead>
					<tr>
						<th v-for="(col, i) in table.columns" :key="i" @click="sortBy(i)" :title="`Sort by ${col}`">
							{{ col }}
							<i v-if="sortColumn === i" :class="['fas', sortAsc ? 'fa-sort-up' : 'fa-sort-down']"></i>
						</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(row, r) in pageRows" :key="r">
						<td v-for="(value, c) in row" :key="c" :class="{ num: typeof value === 'number' }">{{ format(value) }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<script>
const PAGE_SIZE = 100;

export default {
	name: 'PreviewTable',
	props: {
		table: {
			type: Object,
			required: true
		},
		title: {
			type: String,
			default: 'table'
		}
	},
	data() {
		return {
			page: 0,
			sortColumn: null,
			sortAsc: true,
			filter: ''
		};
	},
	computed: {
		rows() {
			let rows = this.table.rows;
			const f = this.filter.trim().toLowerCase();
			if (f) {
				rows = rows.filter(r => r.some(v => v !== null && String(v).toLowerCase().includes(f)));
			}
			if (this.sortColumn !== null) {
				const i = this.sortColumn;
				const dir = this.sortAsc ? 1 : -1;
				rows = rows.slice().sort((a, b) => {
					const x = a[i], y = b[i];
					if (x === y) {
						return 0;
					}
					if (x === null || typeof x === 'undefined') {
						return 1;
					}
					if (y === null || typeof y === 'undefined') {
						return -1;
					}
					return (x < y ? -1 : 1) * dir;
				});
			}
			return rows;
		},
		pageCount() {
			return Math.max(1, Math.ceil(this.rows.length / PAGE_SIZE));
		},
		pageRows() {
			return this.rows.slice(this.page * PAGE_SIZE, (this.page + 1) * PAGE_SIZE);
		}
	},
	watch: {
		filter() {
			this.page = 0;
		}
	},
	methods: {
		sortBy(i) {
			if (this.sortColumn === i) {
				this.sortAsc = !this.sortAsc;
			}
			else {
				this.sortColumn = i;
				this.sortAsc = true;
			}
		},
		format(value) {
			if (value === null || typeof value === 'undefined') {
				return '';
			}
			if (typeof value === 'number') {
				return Number.isInteger(value) ? String(value) : String(parseFloat(value.toPrecision(7)));
			}
			if (typeof value === 'object') {
				return JSON.stringify(value);
			}
			return String(value);
		},
		async downloadCsv() {
			const escape = v => {
				const s = v === null || typeof v === 'undefined' ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
				return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
			};
			const csv = [this.table.columns, ...this.rows].map(r => r.map(escape).join(',')).join('\n');
			const { saveFile } = await import('../../platform');
			await saveFile(new Blob([csv], { type: 'text/csv' }), `${String(this.title || 'table').replace(/\.[^.]+$/, '')}.csv`);
		}
	}
};
</script>

<style lang="scss" scoped>
.preview-table {
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;

	.pt-toolbar {
		display: flex;
		align-items: center;
		gap: 0.75em;
		padding: 0.4em 0.5em;
		border-bottom: 1px solid #ddd;
		flex-wrap: wrap;

		input[type=search] {
			flex: 1;
			min-width: 8em;
			max-width: 20em;
		}
	}

	.pt-scroll {
		flex: 1;
		overflow: auto;
	}

	table {
		border-collapse: collapse;
		font-size: 0.9em;
		width: max-content;
		min-width: 100%;
	}

	th {
		position: sticky;
		top: 0;
		background: #f0f0f0;
		cursor: pointer;
		text-align: left;
		white-space: nowrap;
	}

	th, td {
		padding: 0.25em 0.6em;
		border: 1px solid #e3e3e3;
	}

	td {
		max-width: 30em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	td.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
}
</style>
