<template>
	<Modal minWidth="85%" :title="title" @closed="$emit('closed')">
		<Job :job="job" :currency="currency">
			<template #process-graph>
				<Editor :value="job.process" :editable="false" class="infoViewer" id="jobPgViewer" />
			</template>
		</Job>

		<section class="vue-component result" v-if="resultType">
			<h3>Results</h3>
			<p><em>Below the metadata for the results of the batch job are shown.</em></p>
			<Collection v-if="resultType === 'Collection'" :data="result">
				<template #title><span class="hidden" /></template>
				<template #spatial-extents="p">
					<MapViewer id="jobMap" :show="showMap" :extents="p.extents"></MapViewer>
				</template>
			</Collection>
			<Item v-else :data="result">
				<template #title><span class="hidden" /></template>
				<template #location="p">
					<MapViewer id="jobMap" :show="showMap" :geoJson="p.geometry" :extents="p.bbox"></MapViewer>
				</template>
			</Item>
		</section>
	</Modal>
</template>

<script>
import Utils from '../../utils';
import Modal from './Modal.vue';
import Job from '@openeo/vue-components/components/Job.vue';
import Editor from '../Editor.vue';

export default {
	name: 'JobInfoModal',
	components: {
		Collection: () => import('@openeo/vue-components/components/Collection.vue'),
		Editor,
		Item: () => import('@openeo/vue-components/components/Item.vue'),
		Job,
		MapViewer: () => import('../MapViewer.vue'),
		Modal
	},
	computed: {
		...Utils.mapGetters(['currency']),
		resultType() {
			if (Utils.isObject(this.result)) {
				if (this.result.type === 'Feature') {
					return 'Item';
				}
				else {
					return 'Collection';
				}
			}
			return null;
		},
		title() {
			return "Batch Job: " + (this.job.title || "#" + this.job.id);
		}
	},
	props: {
		job: {
			type: Object
		},
		result: {
			type: Object,
			default: null
		}
	},
	data() {
		return {
			showMap: false
		};
	},
	mounted() {
		this.$nextTick(() => {
			this.showMap = true;
		});
	}
}
</script>

<style lang="scss">
.vue-component.job h2 {
	display: none;
}
.result .vue-component h3 {
	border-bottom: 0;
	font-size: 1.2em;
}
#jobMap {
	height: 300px;
	max-width: 600px;
}
</style>