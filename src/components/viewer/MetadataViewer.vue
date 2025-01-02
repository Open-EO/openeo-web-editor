<template>
	<div class="metadataViewer">
		<Collection v-if="isCollection" :data="data">
			<template #spatial-extents="p">
				<MapExtentViewer class="resultMap" :footprint="p.extents"></MapExtentViewer>
			</template>
		</Collection>
		<Item v-else-if="isItem" :data="data">
			<template #location="p">
				<MapExtentViewer class="resultMap" :footprint="p.geometry || p.bbox"></MapExtentViewer>
			</template>
		</Item>
		<ul v-else class="list">
			<StacAsset v-for="(asset, id) in data.assets" :key="id" :asset="asset" :id="id" :context="data" />
		</ul>
	</div>
</template>

<script>
let tabId = 0;

export default {
	name: 'MetadataViewer',
	props: {
		data: {
			type: Object,
			required: true
		}
	},
	components:  {
		Collection: () => import('@openeo/vue-components/components/Collection.vue'),
		Item: () => import('@openeo/vue-components/components/Item.vue'),
		MapExtentViewer: () => import('../maps/MapExtentViewer.vue'),
		StacAsset: () => import('@openeo/vue-components/components/internal/StacAsset.vue'),
	},
	computed: {
		isCollection() {
			return this.data.type === 'Collection';
		},
		isItem() {
			return this.data.type === 'Feature';
		}
	},
	data() {
		return {
			tabsId: "metadata_viewer_" + tabId++,
		};
	},
	mounted() {
		this.$emit('mounted', this);
	}
};
</script>

<style lang="scss" scoped>
.metadataViewer {
	width: 98%;
	height: 98%;
	padding: 1%;
}
.resultMap {
	height: 300px;
	max-width: 600px;
}
</style>
