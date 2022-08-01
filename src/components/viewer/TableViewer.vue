<template>
	<Splitpanes v-if="content" horizontal class="default-theme">
		<Pane id="table">
			<div v-if="content" class="tableViewer">
				<table>
					<thead>
						<tr>
							<th v-for="(label, col) in header" :key="col">
								<input v-if="col !== 0" type="checkbox" v-model="showCols" :value="col" title="Add column to diagram" /><br />
								{{ label }}
							</th> 
						</tr>
					</thead>
					<tbody>
						<tr v-for="(cols, row) in content" :key="row">
							<component v-for="(value, col) in cols" :key="col" :is="col === 0 ? 'th': 'td'" :class="(typeof value)">
								<input v-if="col === 0" type="checkbox" v-model="showRows" :value="row" title="Add row to diagram" />
								{{ value | locale }}
							</component>
						</tr>
					</tbody>
				</table>
			</div>
			<em v-else>No data retrieved.</em>
		</Pane>
		<Pane v-if="chart" id="chart" :size="50">
			<ScatterChart v-bind="chart" />
		</Pane>
	</Splitpanes>
</template>

<script>
import { Splitpanes, Pane } from 'splitpanes';
import ScatterChart from './ScatterChart.vue';

import CSV from '../../formats/csv';
import JSON_ from '../../formats/json';

export default {
	name: 'TableViewer',
	components: {
		Pane,
		ScatterChart,
		Splitpanes,
	},
	props: {
		data: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			header: null,
			content: null,
			showRows: [],
			showCols: []
		};
	},
	filters: {
		locale(value) {
			return typeof value === 'number' ? value.toLocaleString() : value;
		}
	},
	computed: {
		chart() {
			if (this.showCols.length === 0 && this.showRows.length === 0) {
				return null;
			}
			else if (this.showCols.length > 0 && this.showRows.length > 0) {
				return {error: `You can only add either rows or columns to the diagram. Please unselect either all rows or all columns.`};
			}

			let labels;
			let datasets;
			if (this.showCols.length > 0) {
				labels = this.content.map(rows => rows[0]);
				datasets = this.showCols.map(col => {
					return {
						label: this.header[col],
						data: this.content.map(cols => cols[col])
					};
				});
			}
			else { // rows
				labels = this.header.slice(1);
				datasets = this.showRows.map(row => {
					return {
						label: this.content[row][0],
						data: this.content[row].slice(1)
					};
				});
			}

			return { labels, datasets };
		}
	},
	async created() {
		if(this.data instanceof CSV) {
			let array = this.data.getData();
			if (Array.isArray(array) && array.length > 0) {
				// ToDo: Implement time series parsing for headers... https://www.chartjs.org/docs/latest/axes/cartesian/timeseries.html
				this.header = array.shift();
				this.content = array;
				if (!this.content.every(x => !x || typeof x === 'number')) {
					this.header.unshift("Row");
					this.content.forEach((arr, i) => arr.unshift(String(i+1)));
				}
			}
		}
		else if (this.data instanceof JSON_) {
			let data = this.data.getData();
			let keys = Object.keys(data);
			let values = Object.values(data);

			let headers = new Set();
			values.forEach(row => Object.keys(row).forEach(key => headers.add(key)));
			this.header = Array.from(headers);
			this.content = values.map(row => this.header.map(key => Array.isArray(row[key]) && row[key].length === 1 ? row[key][0] : row[key]));

			this.header.unshift("");
			this.content.forEach((arr, i) => arr.unshift(keys[i]));
		}
		else {
			Utils.error(this, "The format is not supported to be shown in a table.");
		}
	},
	mounted() {
		this.$emit('mounted', this);
	}
};
</script>

<style lang="scss">
.tableViewer {
	width: 100%;
	height: 100%;
	overflow: auto;

	> table {
		width: 100%;

		> thead {
			position: sticky;
			top: 0px;
			background: #eee;
			z-index: 1;

			th {
				border-top: 0;
			}
		}

		> tbody {
			td.number {
				text-align: right;
			}

			th {
				text-align: left;
			}
		}
	}
}
</style>
