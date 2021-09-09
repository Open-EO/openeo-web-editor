<template>
	<Modal width="60%" :title="title" @closed="$emit('closed')">
		<ul class="list">
			<StacAsset v-for="(asset, id) in result.assets" :key="id" :asset="asset" :id="id" :context="data" />
		</ul>
	</Modal>
</template>


<script>
import Modal from './Modal.vue';

export default {
	name: 'DownloadAssetsModal',
	components: {
		StacAsset: () => import('@openeo/vue-components/components/internal/StacAsset.vue'),
		Modal
	},
	props: {
		job: {
			type: Object
		},
		result: {
			type: Object
		}
	},
	computed: {
		title() {
			return "Download Results for: " + (this.job.title || "#" + this.job.id);
		}
	}
}
</script>