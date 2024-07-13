<template>
	<Modal width="60%" :title="title" @closed="$emit('closed')">
		<ul class="list">
			<StacAsset v-for="(asset, id) in result.assets" :key="id" :asset="asset" :id="id" :context="result" :actions="actions" />
		</ul>
	</Modal>
</template>


<script>
import Modal from './Modal.vue';
import EventBusMixin from '../EventBusMixin';

export default {
	name: 'DownloadAssetsModal',
	mixins: [
		EventBusMixin
	],
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
		actions() {
			return [
				{
					icon: "🗺",
					label: "Show on Map",
					show: asset => typeof asset.type === "string" && asset.type.startsWith("image/tiff; application=geotiff"),
					click: (event, asset) => this.broadcast('addToMapChooser', {asset, context: this.result})
				}
			];
		},
		title() {
			return "Download Results for: " + (this.job.title || "#" + this.job.id);
		}
	}
}
</script>