<template>
	<Modal width="80%" :title="collection.id" @closed="$emit('closed')">
		<div class="docgen">
			<Collection :data="collection" />
			<section v-if="currentItems">
				<Items :items="currentItems">
					<template #item-location="p">
						<MapExtentViewer :footprint="p.geometry"></MapExtentViewer>
					</template>
				</Items>
				<div class="pagination">
					<button title="Previous page" @click="paginate(-1)" :disabled="!hasPrevItems"><i class="fas fa-arrow-left"></i> Previous Page</button>
					<button title="Next page" @click="paginate(1)" :disabled="!hasNextItems">Next Page <i class="fas fa-arrow-right"></i></button>
				</div>
			</section>
		</div>
	</Modal>
</template>

<script>
import Modal from './Modal.vue';
import Collection from '../Collection.vue';
import Utils from '../../utils.js';
import StacMigrate from '@radiantearth/stac-migrate';

export default {
	name: 'CollectionModal',
	components: {
		MapExtentViewer: () => import('../maps/MapExtentViewer.vue'),
		Modal,
		Collection,
		Items: () => import('@openeo/vue-components/components/Items.vue')
	},
	data() {
		return {
			items: [],
			itemsPage: 0,
			itemsIterator: null
		};
	},
	props: {
		collection: {
			type: Object
		}
	},
	computed: {
		...Utils.mapState(['connection']),
		...Utils.mapGetters(['supports']),
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
	async mounted() {
		if (this.supports('listCollectionItems')) {
			await this.nextItems();
			// Always request a page in advance so that we know whether a next page is available.
			this.nextItems();
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
				this.items.push(StacMigrate.item(next.value, null, false));
			}
		}
	}
}
</script>

<style lang="scss">
.vue-component.styled-description .docgen {
	h1, h2, h3, h4, h5 {
		margin: 1.5em 0 0 0;
		padding: 0;
		border: 0;
		font-size: 1.1em;
	}
	h1 {
		font-size: 1.2em;
	}
	h2 {
		font-size: 1.15em;
	}
}
.docgen {
	.collection > h2 {
		display: none;
	}

	.items > h2 {
		display: block;
		font-size: 1.4em;
		margin-top: 1.5em;
		border-bottom-style: dotted;
	}
}
</style>