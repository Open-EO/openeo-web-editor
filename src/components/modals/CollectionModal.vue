<template>
	<Modal ref="modal">
		<template #main>
			<div class="docgen">
				<Collection :data="collection">
					<template #spatial-extents="p">
						<MapViewer id="collectionMap" :show="showMap" :extents="p.extents"></MapViewer>
					</template>
				</Collection>
				<section v-if="currentItems">
					<Items :items="currentItems">
						<template #item-location="p">
							<MapViewer :id="String(Date.now())" :geoJson="p.geometry"></MapViewer>
						</template>
					</Items>
					<div class="pagination">
						<button title="Previous page" @click="paginate(-1)" :disabled="!hasPrevItems"><i class="fas fa-arrow-left"></i> Previous Page</button>
						<button title="Next page" @click="paginate(1)" :disabled="!hasNextItems">Next Page <i class="fas fa-arrow-right"></i></button>
					</div>
				</section>
			</div>
		</template>
	</Modal>
</template>

<script>
import MapViewer from '../MapViewer.vue';
import Modal from './Modal.vue';
import Collection from '@openeo/vue-components/components/Collection.vue';
import Utils from '../../utils.js';

export default {
	name: 'CollectionModal',
	components: {
		MapViewer,
		Modal,
		Collection,
		Items: () => import('@openeo/vue-components/components/Items.vue')
	},
	data() {
		return {
			collection: null,
			showMap: false,
			items: [],
			itemsPage: 0,
			itemsIterator: null
		};
	},
	computed: {
		...Utils.mapState(['connection']),
		...Utils.mapGetters(['supports']),
		bbox() {
			try {
				return this.collection.extent.spatial.bbox[0];
			} catch(e) {
				return null;
			}
		},
		currentItems() {
			if (this.items.length >= this.itemsPage) {
				return this.items[this.itemsPage];
			}
			return null;
		},
		hasPrevItems() {
			return (this.itemsPage > 0);
		},
		hasNextItems() {
			return (this.itemsPage < this.items.length - 1);
		}
	},
	methods: {
		async paginate(step) {
			if (step > 0) {
				await this.nextItems();
			}
			else if (this.itemsPage === 0 && step < 0) {
				return;
			}

			this.itemsPage += step;
		},
		async nextItems() {
			if (!this.itemsIterator) {
				this.itemsIterator = await this.connection.listCollectionItems(this.collection.id);
			}
			let next = await this.itemsIterator.next();
			if (next && next.value && !next.done) {
				this.items.push(next.value);
			}
		},
		async show(collection) {
			this.collection = collection;
			this.items = [];
			this.itemsPage = 0;
			this.itemsIterator = null;
			this.$refs.modal.show(collection.id);
			this.$nextTick(() => {
				this.showMap = true;
			});
			if (this.supports('listCollectionItems')) {
				await this.nextItems();
				// Always request a page in advance so that we know whether a next page is available.
				this.nextItems();
			}
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
.docgen .items h2 {
	display: block;
	font-size: 1.4em;
    margin-top: 1.5em;
    border-bottom-style: dotted;
}
#collectionMap {
	height: 300px;
	width: 100%;
	max-width: 600px;
}
</style>