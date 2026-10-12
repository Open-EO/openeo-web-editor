<template>
	<div class="preview-chart">
		<LineChart :chart-data="chartData" :chart-options="chartOptions" :height="height" />
	</div>
</template>

<script>
import { Line as LineChart } from 'vue-chartjs/legacy';
import {
	Chart as ChartJS,
	Title,
	Tooltip,
	Legend,
	LineElement,
	LinearScale,
	CategoryScale,
	TimeScale,
	PointElement
} from 'chart.js';
import 'chartjs-adapter-luxon';

ChartJS.register(Title, Tooltip, Legend, LineElement, LinearScale, CategoryScale, TimeScale, PointElement);

const COLORS = ['#3366CC', '#DC3912', '#FF9900', '#109618', '#990099', '#0099C6', '#DD4477', '#66AA00', '#B82E2E', '#316395', '#994499', '#22AA99', '#AAAA11', '#6633CC', '#E67300'];

export default {
	name: 'PreviewChart',
	components: {
		LineChart
	},
	props: {
		// [{ label, data: [{ x, y }] }]
		datasets: {
			type: Array,
			default: () => []
		},
		timeAxis: {
			type: Boolean,
			default: false
		},
		title: {
			type: String,
			default: null
		},
		xLabel: {
			type: String,
			default: null
		},
		height: {
			type: Number,
			default: 300
		}
	},
	computed: {
		chartData() {
			return {
				datasets: this.datasets.map((ds, i) => ({
					borderColor: COLORS[i % COLORS.length],
					backgroundColor: COLORS[i % COLORS.length],
					borderWidth: 1.5,
					pointRadius: ds.data.length > 200 ? 0 : 2.5,
					spanGaps: true,
					tension: 0,
					...ds
				}))
			};
		},
		chartOptions() {
			return {
				responsive: true,
				maintainAspectRatio: false,
				animation: false,
				parsing: true,
				interaction: { mode: 'nearest', intersect: false },
				plugins: {
					title: { display: Boolean(this.title), text: this.title },
					legend: { display: this.datasets.length > 1, position: 'bottom', labels: { boxWidth: 12 } }
				},
				scales: {
					x: this.timeAxis
						? { type: 'time', adapters: { date: { zone: 'UTC' } }, title: { display: Boolean(this.xLabel), text: this.xLabel } }
						: { type: 'category', title: { display: Boolean(this.xLabel), text: this.xLabel } },
					y: { type: 'linear' }
				}
			};
		}
	}
};
</script>

<style lang="scss" scoped>
.preview-chart {
	width: 100%;
	height: 100%;
	padding: 0.5em;
	box-sizing: border-box;
	position: relative;

	> div {
		height: 100%;
	}
}
</style>
