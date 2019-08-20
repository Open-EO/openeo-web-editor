<template>
	<Modal ref="modal">
		<template #main>
			<div class="docgen">
				<Collection :collectionData="collection" :version="version">
					<template slot="collection-spatial-extent">
						<MapViewer id="collectionMap" :show="showMap" :showExtent="collection.extent.spatial"></MapViewer>
					</template>
				</Collection>
			</div>
		</template>
	</Modal>
</template>

<script>
import MapViewer from './MapViewer';
import Modal from './Modal.vue';
import Collection from '@openeo/vue-components/components/Collection.vue';

export default {
	name: 'CollectionModal',
	components: {
		MapViewer,
		Modal,
		Collection
	},
	data() {
		return {
			version: null,
			collection: null,
			showMap: false
		};
	},
	methods: {
		show(collection, version) {
			this.version = version;
			this.collection = collection;
			this.$refs.modal.show(collection.id);
			this.$nextTick(() => {
				this.showMap = true;
			});
		}
	}
}
</script>

<style>
.docgen h2 {
	display: none;
}
#collectionMap {
	height: 300px;
	width: 100%;
	max-width: 600px;
}
</style>