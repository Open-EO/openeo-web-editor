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
		},
		filter: {
			type: Function,
			default: null
		}
	},
	computed: {
		...Utils.mapState(['collections']),
		filteredCollections() {
			if (typeof this.filter === 'function') {
				return this.collections.filter(this.filter);
			}
			else {
				return this.collections;
			}
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