<template>
	<Modal ref="modal" minWidth="85%">
		<template #main>
			<section class="vue-component basedata">
				<div class="tabular"><label>ID:</label> <code class="value">{{ job.id }}</code></div>
			</section>

			<section class="vue-component description" v-if="job.description">
				<h3>Description</h3>
				<Description :description="job.description"></Description>
			</section>

			<section class="vue-component progress">
				<h3>Progress</h3>
				<div class="tabular"><label>Submitted:</label> <span class="value">{{ created }}</span></div>
				<div class="tabular"><label>Updated:</label> <span class="value">{{ updated }}</span></div>
				<div class="tabular"><label>Status:</label> <span class="value status" :data-value="job.status">{{ job.status }}</span></div>
				<div class="tabular" v-if="typeof job.progress === 'number'"><label>Progress:</label> <div class="value">
					<div class="progressBar" :class="{error: !!job.error}">
						<div class="completed" :style="'width: ' + progress">
							<span class="number" v-if="job.progress > 50">{{ progress }}</span>&nbsp;
						</div>
						<span class="number" v-if="job.progress <= 50">{{ progress }}</span>
					</div>
				</div></div>
			</section>

			<section class="vue-component billing" v-if="job.plan || job.costs || job.budget">
				<h3>Billing</h3>
				<div class="tabular" v-if="job.plan"><label>Billing plan:</label> <span class="value">{{ job.plan }}</span></div>
				<div class="tabular" v-if="job.costs"><label>Costs:</label> <span class="value">{{ formatCurrency(job.costs) }}</span></div>
				<div class="tabular" v-if="job.budget"><label>Budget:</label> <span class="value">{{ formatCurrency(job.budget) }}</span></div>
			</section>

			<section class="vue-component result" v-if="resultType">
				<h3>Results</h3>
				<p><em>Below the metadata for the results of the batch job are shown.</em></p>
				<Collection v-if="resultType === 'Collection'" :data="result">
					<template #title><span class="hidden" /></template>
					<template #spatial-extents="p">
						<MapViewer id="collectionMap" :show="showMap" :extents="p.extents"></MapViewer>
					</template>
				</Collection>
				<Item v-else :data="result">
					<template #title><span class="hidden" /></template>
					<template #location="p">
						<MapViewer id="itemMap" :show="showMap" :geoJson="p.geometry" :extents="p.bbox"></MapViewer>
					</template>
				</Item>
			</section>

			<section class="vue-component process-graph">
				<h3>Process</h3>
				<Editor :value="job.process" :editable="false" class="infoViewer" id="jobPgViewer" />
			</section>

		</template>
	</Modal>
</template>

<script>
import Utils from '../../utils';
import Modal from './Modal.vue';
import Description from '@openeo/vue-components/components/Description.vue';
import Editor from '../Editor.vue';

export default {
	name: 'JobInfoModal',
	components: {
		Collection: () => import('@openeo/vue-components/components/Description.vue'),
		Description,
		Editor,
		Item: () => import('@openeo/vue-components/components/Item.vue'),
		Modal
	},
	computed: {
		...Utils.mapGetters(['formatCurrency']),
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
		created() {
			return Utils.formatDateTime(this.job.created);
		},
		updated() {
			if (this.job.updated) {
				return Utils.formatDateTime(this.job.updated);
			}
			else {
				return "N/A";
			}
		},
		displayTitle() {
			return "Batch Job: " + (this.job.title || "#" + this.job.id);
		},
		progress() {
			if (typeof this.job.progress === 'number') {
				return Math.round(this.job.progress*10)/10 + "%";
			}
			else {
				return "0%";
			}
		}
	},
	data() {
		return {
			job: {},
			result: null,
			showMap: false
		};
	},
	methods: {
		show(job, result = null) {
			this.job = job;
			this.result = result;
			this.$refs.modal.show(this.displayTitle);
			this.$nextTick(() => {
				this.showMap = true;
			});
		}
	}
}
</script>

<style scoped>
.progressBar {
	background-color: #eee;
	border: 1px solid #ccc;
	color: black;
	height: 1.2em;
	border-radius: 0.3em;
}
.progressBar .number {
	font-size: 0.8em;
	padding: 0.1em 0.3em;
	display: inline-block;
}
.progressBar .completed {
	background-color: green;
	width: 1px;
	height: 1.2em;
	color: white;
	display: inline-block;
	border-radius: 0.3em;
}
.progressBar.error .completed {
	background-color: maroon;
}

.errorLinks, .errorInternals {
	font-size: 0.9em;
	margin-top: 0.5em;
}
</style>

<style>
.result .vue-component h3 {
	border-bottom: 0;
	font-size: 1.2em;
}
</style>
