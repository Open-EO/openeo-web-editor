<template>
	<Modal class="collection" width="80%" height="96%" :title="collection.id" @closed="$emit('closed')">
		<Tabs id="collection-modal" position="bottom">
			<Tab id="metadata" name="Overview" icon="fa-info" class="docgen">
				<Collection :data="collection" />
			</Tab>
			<Tab id="items" name="Items" icon="fa-images" class="docgen" @show="showHiddenMap=true" @hide="showHiddenMap=false">
				<section class="items" v-if="currentItems">
					<Items :items="currentItems" showMap>
						<template #map="p">
							<MapExtentViewer :show="showHiddenMap" ref="overview" :footprint="p.geojson" :fill="false"></MapExtentViewer>
						</template>
						<template #after-search-box>
							<div class="pagination">
								<AsyncButton :fn="() => paginate(-1)" :disabled="!hasPrevItems" fa icon="fas fa-arrow-left">Previous Page</AsyncButton>
								<AsyncButton :fn="() => paginate(1)" :disabled="!hasNextItems" fa icon="fas fa-arrow-right">Next Page</AsyncButton>
							</div>
						</template>
						<template #item-location="p">
							<MapExtentViewer :show="showHiddenMap" :footprint="p.geometry"></MapExtentViewer>
						</template>
					</Items>
					<div class="pagination">
						<AsyncButton :fn="() => paginate(-1)" :disabled="!hasPrevItems" fa icon="fas fa-arrow-left">Previous Page</AsyncButton>
						<AsyncButton :fn="() => paginate(1)" :disabled="!hasNextItems" fa icon="fas fa-arrow-right">Next Page</AsyncButton>
					</div>
				</section>
				<section v-else>Individual items are not available for this collection.</section>
			</Tab>
		</Tabs>
	</Modal>
</template>

<script>
import Modal from './Modal.vue';
import Collection from '../Collection.vue';
import Utils from '../../utils.js';
import StacMigrate from '@radiantearth/stac-migrate';
import AsyncButton from '@openeo/vue-components/components/internal/AsyncButton.vue';
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import Tab from '@openeo/vue-components/components/Tab.vue';

export default {
	name: 'CollectionModal',
	components: {
		AsyncButton,
		MapExtentViewer: () => import('../maps/MapExtentViewer.vue'),
		Modal,
		Collection,
		Items: () => import('@openeo/vue-components/components/Items.vue'),
		Tabs,
		Tab
	},
	data() {
		return {
			items: [],
			itemsPage: 0,
			itemPages: null,
			showHiddenMap: false
		};
	},
	props: {
		collection: {
			type: Object
		}
	},
	computed: {
		...Utils.mapState(['connection', 'pageLimit']),
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
			return this.itemPages.hasNextPage() || (this.itemsPage < this.items.length - 1);
		}
	},
	async mounted() {
		if (this.supports('listCollectionItems')) {
			await this.nextItems();
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
			if (!this.itemPages) {
				this.itemPages = await this.connection.listCollectionItems(this.collection.id, null, null, this.pageLimit);
			}
			let items = await this.itemPages.nextPage();
			items = items.map(item => StacMigrate.item(item, this.collection, false));
			this.items.push(items);
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
.vue-component.collection > h2 {
	display: none;
}

.vue-component.items > .searchable-list > h2 {
	display: block;
	font-size: 1.4em;
	border-bottom-style: dotted;
}

.modal.collection {
	.map-extent {
		height: 300px;
	}
	.modal-content {
		padding: 0;
		overflow: hidden;
		width: 100%;
		height: 100%;
	}
	.items .pagination {
		margin: 1em 0;
	}
	#collection-modal {
		width: 100%;
		height: 100%;
		
		> .tabsBody > .tabContent {
			padding: 1em;
			overflow: auto;
		}
	}
}
</style>