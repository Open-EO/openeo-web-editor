<template>
	<div class="chart">
		<template v-if="error">{{ error }}</template>
		<Scatter v-else :chart-data="chartData" :chart-options="chartOptions" :height="height" />
	</div>
</template>

<script>
import { Scatter } from 'vue-chartjs/legacy';

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  TimeSeriesScale,
  PointElement
} from 'chart.js'

import 'chartjs-adapter-luxon';
import { DateTime } from 'luxon';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  TimeSeriesScale,
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
	name: 'ScatterChart',
	components: {
		Scatter
	},
	props: {
		labels: {
			type: Array,
			default: () => ([])
		},
		datasets: {
			type: Array,
			default: () => ([])
		},
		options: {
			type: Object,
			default: () => ({
				responsive: true,
				maintainAspectRatio: false
			})
		},
		error: {
			type: String,
			default: ""
		},
		height: {
			type: Number,
			default: 350
		},
		title: {
			type: String,
			default: ""
		}
	},
	computed: {
		chartData() {
			let nextColor = 0;
			let datasets = this.datasets.map((dataset, i) => {
				let defaults = {};
				if (typeof dataset.backgroundColor === 'undefined' &&  typeof dataset.borderColor === 'undefined') {
					let color = colors[nextColor++ % colors.length];
					defaults.backgroundColor = color;
					defaults.color = color;
				}
				if (typeof dataset.borderWidth === 'undefined') {
					defaults.borderWidth = 1;
				}
				if (typeof dataset.label === 'undefined') {
					defaults.label = i+1;
				}
				return Object.assign(defaults, dataset);
			});
			return { labels: this.labels, datasets };
		},
		chartOptions() {
			let options = Object.assign({}, this.options);

			// Show title
			if (this.title) {
				options.plugins = options.plugins || {};
				options.plugins.title = {
					display: true,
        	text: this.title
				};
      }
			// Detect timeseries from labels
			if (this.labels.every(label => DateTime.fromISO(label).isValid)) {
				options.scales = {
					x: {
						type: 'timeseries',
						adapters: {
							date: {
								zone: 'UTC'
							}
						}
					}
				};
			}
			// Check if labels are categorical
			if (this.labels.every(label => typeof label === 'string')) {
				options.scales = {
					x: {
						type: 'category'
					}
				};
			}

			return options;
		}
	}
}
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
</style>