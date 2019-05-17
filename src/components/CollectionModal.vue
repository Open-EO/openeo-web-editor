<template>
	<Modal ref="modal">
		<template v-slot:main>
			<div class="docgen">
				<Collection :collectionData="collection" :version="version">
					<template slot="collection-spatial-extent">
						<div id="collectionMap"></div>
					</template>
				</Collection>
			</div>
		</template>
	</Modal>
</template>

<script>
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Modal from './Modal.vue';
import Collection from '@openeo/vue-components/components/Collection.vue';

export default {
	name: 'CollectionModal',
	components: {
		Modal,
		Collection
	},
	data() {
		return {
			version: null,
			collection: null
		};
	},
	methods: {
		show(collection, version) {
			this.version = version;
			this.collection = collection;
			this.$refs.modal.show(collection.id);
			this.$nextTick(this.initMap);
		},
		initMap() {
			var map = new L.Map('collectionMap');
			var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				name: 'OpenStreetMap',
				attribution: 'Map data &copy; <a href="http://www.osm.org">OpenStreetMap</a>'
			});
			osm.addTo(map);

			var rectangle = L.rectangle([[this.collection.extent.spatial[3], this.collection.extent.spatial[0]], [this.collection.extent.spatial[1], this.collection.extent.spatial[2]]]);
			rectangle.addTo(map);

			map.fitBounds(rectangle.getBounds());
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