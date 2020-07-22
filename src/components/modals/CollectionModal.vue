<template>
	<Modal ref="modal">
		<template #main>
			<div class="docgen">
				<Collection :collectionData="collection" :version="version">
					<template slot="collection-spatial-extents" slot-scope="p">
						<MapViewer id="collectionMap" :show="showMap" :extents="p.extents"></MapViewer>
					</template>
				</Collection>
			</div>
		</template>
	</Modal>
</template>

<script>
import MapViewer from '../MapViewer.vue';
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
	computed: {
		bbox() {
			try {
				return this.collection.extent.spatial.bbox[0];
			} catch(e) {
				return null;
			}
		}
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
.vue-component.styled-description h1,
.vue-component.styled-description h2,
.vue-component.styled-description h3,
.vue-component.styled-description h4,
.vue-component.styled-description h5 {
	margin: 1.5em 0 0 0;
	padding: 0;
	border: 0;
	font-size: 1.1em;
}
.vue-component.styled-description h1 {
	font-size: 1.2em;
}
.vue-component.styled-description h2 {
	font-size: 1.15em;
}
.docgen h2 {
	display: none;
}
#collectionMap {
	height: 300px;
	width: 100%;
	max-width: 600px;
}
</style>