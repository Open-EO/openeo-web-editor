<template>
	<VueCollection :data="data" :federation="federation">
		<template #spatial-extents="p">
			<span v-if="p.worldwide" class="worldwide"><i class="fas fa-globe"></i> Worldwide</span>
			<MapExtentViewer v-else class="map" :footprint="p.extents"></MapExtentViewer>
		</template>
	</VueCollection>
</template>

<script>
import VueCollection from '@openeo/vue-components/components/Collection.vue';
import Utils from '../utils.js';

export default {
	name: 'Collection',
	components: {
		MapExtentViewer: () => import('./maps/MapExtentViewer.vue'),
		VueCollection
	},
	props: {
		data: {
			type: Object,
			required: true
		}
	},
	computed: {
		...Utils.mapState(['connection']),
		...Utils.mapGetters(['federation', 'supports']),
		bbox() {
			try {
				return this.data.extent.spatial.bbox[0];
			} catch(e) {
				return null;
			}
		}
	}
}
</script>