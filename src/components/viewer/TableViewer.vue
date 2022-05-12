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
		<Pane v-if="chartData" id="chart" :size="50">
			<div class="chart">
				<template v-if="typeof chartData === 'string'">{{ chartData }}</template>
				<LineChart v-else-if="showChart" :chart-options="chartOptions" :chart-data="chartData" :height="400" />
			</div>
		</Pane>
	</Splitpanes>
</template>

<script>
import { Line as LineChart } from 'vue-chartjs/legacy';
import { Splitpanes, Pane } from 'splitpanes';

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement
} from 'chart.js'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement
);

const colors = [
	'#3366CC',
	'#DC3912',
	'#FF9900',
	'#109618',
	'#990099',
	'#3B3EAC',
	'#0099C6',
	'#DD4477',
	'#66AA00',
	'#B82E2E',
	'#316395',
	'#994499',
	'#22AA99',
	'#AAAA11',
	'#6633CC',
	'#E67300',
	'#8B0707',
	'#329262',
	'#5574A6',
	'#3B3EAC'
];

export default {
	name: 'TableViewer',
	components: {
		LineChart,
		Pane,
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
			showChart: false, // Workaround for a weird vue-chartjs bug
			nextColor: 0,
			header: null,
			content: null,
			showRows: [],
			showCols: [],
			chartOptions: {
        		responsive: true,
				maintainAspectRatio: false
			}
		};
	},
	filters: {
		locale(value) {
			return typeof value === 'number' ? value.toLocaleString() : value;
		}
	},
	watch: {
		chartData(newVal) {
			this.showChart = false;
			if (newVal) {
				this.$nextTick(() => this.showChart = true);
			}
		}
	},
	computed: {
		chartData() {
			if (this.showCols.length === 0 && this.showRows.length === 0) {
				return null;
			}
			else if (this.showCols.length > 0 && this.showRows.length > 0) {
				return `You can only add either rows or columns to the diagram. Please unselect either all rows or all columns.`;
			}

			if (this.showCols.length > 0) {
				let labels = this.content.map(rows => rows[0]);
				let datasets = this.showCols.map(col => {
					let color = colors[this.nextColor++ % colors.length];
					return {
						label: this.header[col],
						data: this.content.map(cols => cols[col]),
						backgroundColor: color,
						borderColor: color,
						borderWidth: 1
					};
				});
				return { labels, datasets };
			}
			else { // rows
				let labels = this.header.slice(1);
				let datasets = this.showRows.map(row => {
					let color = colors[this.nextColor++ % colors.length];
					return {
						label: this.content[row][0],
						data: this.content[row].slice(1),
						backgroundColor: color,
						borderColor: color,
						borderWidth: 1
					};
				});
				return { labels, datasets };
			}
		}
	},
	async created() {
		let array = await this.data.getData();
		if (Array.isArray(array) && array.length > 0) {
			this.header = array.shift();
			this.content = array;
			if (this.content.some(x => typeof x !== 'number')) {
				this.header.unshift("Row");
				this.content.forEach((arr, i) => arr.unshift(String(i+1)));
			}
		}
	}
};
</script>

<style lang="scss">
.chart {
	width: 100%;
	height: 100%;
	padding: 0.5em;
	margin: auto;
	box-sizing: border-box;
	overflow: auto;
}
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
