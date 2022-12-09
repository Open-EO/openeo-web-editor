<template>
	<div class="step choose-collection">
		<p>Please select the collection which you want to download data for.</p>
		<Collections heading="" :collections="filteredCollections" :offerDetails="false">
			<template #summary="{ item }">
				<div :class="{element: true, selected: item.id == value}">
					<div class="summary" @click="update(item.id)">
						<strong :title="item.id">{{ item.id }}</strong>
						<small v-if="item.title" :title="item.title">{{ item.title }}</small>
					</div>
					<button class="button" type="button" @click="showCollectionInfo(item.id)" title="Show collection details"><i class="fas fa-info"></i></button>
				</div>
			</template>
		</Collections>
	</div>
</template>

<script>
import Collections from '@openeo/vue-components/components/Collections.vue';
import Utils from '../../../utils';
import EventBusMixin from '../../EventBusMixin';

export default {
	name: 'ChooseCollection',
	mixins: [
		EventBusMixin
	],
	components: {
		Collections
	},
	props: {
		value: {
			type: String,
			default: null
		}
	},
	computed: {
		...Utils.mapState(['collections']),
		filteredCollections() {
			return this.collections.filter(c => {
				if (!Utils.isObject(c['cube:dimensions'])) {
					return true;
				}

				let dims = Object.values(c['cube:dimensions']);
				if (dims.length !== 4) {
					// More or less than 4 dimensions don't work (we need x,y,t,b)
					return false;
				}

				let bandDimension = dims.find(d => d.type === 'bands');
				if (bandDimension) {
					// Collections with 1 band can't be used to compute an index (requires 2 bands)
					if (Array.isArray(bandDimension.values) && bandDimension.values.length === 1) {
						return false;
					}
				}

				let timeDimensions = dims.filter(d => d.type === 'temporal');
				if (timeDimensions.length > 1) {
					// Collections with more than a single time dimension don't work
					return false;
				}

				let spatialDimensions = dims.filter(d => d.type === 'spatial' && ['x', 'y'].includes(d.axis));
				if (spatialDimensions.length === 2) {
					// Collections with more than a two spatial dimensions don't work
					return false;
				}

				return true;
			});
		}
	},
	methods: {
		...Utils.mapActions(['describeCollection']),
		async update(id) {
			this.$emit('input', id);
		},
		showCollectionInfo(id) {
			this.broadcast('showCollection', id);
		}
	}
}
</script>

<style lang="scss">
.choose-collection {
	.vue-component.searchable-list ul.list > li {
		margin-bottom: 0;

		> summary {
			margin: 0;
			line-height: inherit;

			&:before {
				content: '';
				margin-left: 0;
				float: none;
			}
		}
	}
}
</style>