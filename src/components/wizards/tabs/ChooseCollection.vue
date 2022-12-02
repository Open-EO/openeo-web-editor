<template>
	<div class="step choose-collection">
		<p>Please select the collection which you want to download data for.</p>
		<Collections heading="" :collections="collections" :offerDetails="false">
			<template #summary="{ item }">
				<div :class="{element: true, selected: item.id == value}">
					<div class="summary" @click="update(item.id)">
						<strong :title="item.id">{{ item.id }}</strong>
						<small v-if="item.title" :title="item.title">{{ item.title }}</small>
					</div>
					<button class="button" type="button" @click="showCollectionInfo(item.id)" title="View on map"><i class="fas fa-info"></i></button>
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
	.vue-component.searchable-list ul.list > li > summary:before {
		content: '';
		margin-left: 0;
		float: none;
	}
	.vue-component.searchable-list ul.list > li > summary {
		margin: 0;
		line-height: inherit;
	}
	.vue-component.searchable-list ul.list > li {
		margin-bottom: 0;
	}
}
</style>