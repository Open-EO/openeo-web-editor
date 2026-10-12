<template>
	<div :class="['preview-pane', { single: viewCount <= 1 }]">
		<div v-if="warnings.length" class="pp-warnings">
			<i class="fas fa-exclamation-triangle"></i>
			<span>{{ warnings.join(' ') }}</span>
		</div>
		<Tabs :id="tabsId" position="bottom" ref="tabs" class="pp-tabs">
			<Tab v-if="showMap" id="map" name="Map" icon="fa-map" :selected="firstTab === 'map'" @show="onSubShow('map')">
				<PreviewMap ref="map" :dataset="dataset" :service="service" />
			</Tab>
			<Tab v-for="(source, i) in plainRasters" :key="`image${i}`" :id="`image${i}`" :name="source.title || 'Image'" icon="fa-image" :selected="firstTab === `image${i}`">
				<RasterImage :source="source" />
			</Tab>
			<Tab v-for="(chart, i) in charts" :key="`chart${i}`" :id="`chart${i}`" :name="charts.length > 1 ? `Chart ${i + 1}` : 'Chart'" icon="fa-chart-line" :selected="firstTab === `chart${i}`">
				<PreviewChart v-bind="chart" :height="300" />
			</Tab>
			<Tab v-for="(table, i) in tables" :key="`table${i}`" :id="`table${i}`" :name="table.title && tables.length > 1 ? table.title : 'Table'" icon="fa-table" :selected="firstTab === `table${i}`">
				<PreviewTable :table="table" :title="table.title || title" />
			</Tab>
			<Tab v-if="hasRaw" id="raw" name="Data" icon="fa-code" :selected="firstTab === 'raw'">
				<pre v-if="typeof dataset.raw !== 'object'" class="pp-text">{{ dataset.raw }}</pre>
				<ObjectTree v-else class="pp-tree" :data="dataset.raw" />
			</Tab>
			<Tab v-if="dataset && dataset.info" id="info" name="Details" icon="fa-info" :selected="firstTab === 'info'">
				<div class="pp-info">
					<p v-if="dataset.format"><strong>Format:</strong> {{ dataset.format }}</p>
					<ObjectTree :data="dataset.info" />
				</div>
			</Tab>
		</Tabs>
	</div>
</template>

<script>
import ObjectTree from '@openeo/vue-components/components/ObjectTree.vue';
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import Tab from '@openeo/vue-components/components/Tab.vue';
import { Service } from '@openeo/js-client';
import DataFile from '../../formats/dataFile';
import PreviewMap from './PreviewMap.vue';

let paneId = 0;

export default {
	name: 'PreviewPane',
	components: {
		ObjectTree,
		PreviewChart: () => import('./PreviewChart.vue'),
		PreviewMap,
		PreviewTable: () => import('./PreviewTable.vue'),
		RasterImage: () => import('./RasterImage.vue'),
		Tab,
		Tabs
	},
	props: {
		// A DataFile or an openEO web service
		data: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			tabsId: `preview_pane_${paneId++}`
		};
	},
	computed: {
		dataset() {
			return this.data instanceof DataFile ? this.data.getData() : null;
		},
		service() {
			return this.data instanceof Service ? this.data : null;
		},
		title() {
			return this.data.title || (this.dataset && this.dataset.title) || 'data';
		},
		showMap() {
			return Boolean(this.service) || Boolean(this.dataset && this.dataset.hasMap);
		},
		plainRasters() {
			return this.dataset ? this.dataset.rasters.filter(r => !r.isGeoreferenced()) : [];
		},
		charts() {
			return this.dataset ? this.dataset.charts : [];
		},
		tables() {
			if (!this.dataset) {
				return [];
			}
			if (this.dataset.tables.length > 0) {
				return this.dataset.tables;
			}
			// Attribute tables for vector data
			return this.dataset.vectors
				.map(v => Object.assign(v.toTable(), { title: v.title }))
				.filter(t => t.columns.length > 0);
		},
		hasRaw() {
			return Boolean(this.dataset) && typeof this.dataset.raw !== 'undefined';
		},
		warnings() {
			return this.dataset ? this.dataset.warnings : [];
		},
		firstTab() {
			if (this.showMap) {
				return 'map';
			}
			if (this.plainRasters.length) {
				return 'image0';
			}
			if (this.charts.length) {
				return 'chart0';
			}
			if (this.tables.length) {
				return 'table0';
			}
			return this.hasRaw ? 'raw' : 'info';
		},
		viewCount() {
			return (this.showMap ? 1 : 0) + this.plainRasters.length + this.charts.length + this.tables.length + (this.hasRaw ? 1 : 0) + (this.dataset && this.dataset.info ? 1 : 0);
		}
	},
	mounted() {
		this.$emit('mounted', this);
	},
	beforeDestroy() {
		if (this.data instanceof DataFile) {
			this.data.unload();
		}
	},
	methods: {
		onSubShow(which) {
			if (which === 'map' && this.$refs.map) {
				this.$refs.map.onShow();
			}
		},
		onShow() {
			this.onSubShow('map');
		},
		onHide() {},
		async addFile(file) {
			if (!this.$refs.map) {
				throw new Error('This tab has no map to add data to.');
			}
			return await this.$refs.map.addFile(file);
		}
	}
};
</script>

<style lang="scss">
.preview-pane {
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;

	.pp-warnings {
		background: #fff8e1;
		border-bottom: 1px solid #ffe082;
		padding: 0.3em 0.6em;
		font-size: 0.85em;
		display: flex;
		gap: 0.5em;
		align-items: baseline;
	}

	.pp-tabs {
		flex: 1;
		min-height: 0;

		&.tabs.boxed {
			border: 0;
		}

		> .tabsBody > .tabContent {
			height: 100%;
			overflow: auto;
		}
	}

	&.single .pp-tabs > .tabsHeader {
		display: none;
	}

	.pp-text, .pp-tree, .pp-info {
		padding: 0.5em;
		margin: 0;
	}

	.pp-text {
		white-space: pre-wrap;
	}
}
</style>
