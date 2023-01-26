<template>
	<div class="wizard-tab-content">
		<WizardTab :pos="0" :parent="parent" title="Data Source" :beforeChange="() => collection !== null">
			<ChooseCollection :value="collection" @input="submitCollection" />
		</WizardTab>
		<WizardTab :pos="1" :parent="parent" title="Location" :beforeChange="() => spatial_extent !== null">
			<ChooseBoundingBox v-model="spatial_extent" :max="max_spatial_extent" />
		</WizardTab>
		<WizardTab :pos="2" :parent="parent" title="Temporal Coverage" :beforeChange="() => temporal_extent !== null">
			<ChooseTime v-model="temporal_extent" />
		</WizardTab>
		<WizardTab :pos="3" :parent="parent" title="File Format" :beforeChange="() => format !== null">
			<ChooseFormat v-model="format" />
		</WizardTab>
		<WizardTab :pos="4" :parent="parent" title="Finish">
			<ChooseProcessingMode v-model="mode" :title.sync="jobTitle" />
		</WizardTab>
	</div>
</template>

<script>
import ChooseBoundingBox from './tabs/ChooseBoundingBox.vue';
import ChooseCollection from './tabs/ChooseCollection.vue';
import ChooseFormat from './tabs/ChooseFormat.vue';
import ChooseProcessingMode from './tabs/ChooseProcessingMode.vue';
import ChooseTime from './tabs/ChooseTime.vue';
import WizardMixin from './WizardMixin';
import { Builder } from '@openeo/js-client';
import Utils from '../../utils';

export default {
	name: "Download",
	mixins: [
		WizardMixin
	],
	components: {
		ChooseBoundingBox,
		ChooseCollection,
		ChooseFormat,
		ChooseProcessingMode,
		ChooseTime
	},
	data() {
		return {
			collection: null,
			format: null,
			jobTitle: 'Download created by Wizard',
			mode: "",
			spatial_extent: null,
			max_spatial_extent: null,
			temporal_extent: null
		};
	},
	computed: {
		...Utils.mapGetters(['processes', 'collectionDefaults'])
	},
	methods: {
		submitCollection(id) {
			if (this.collection !== id || this.temporal_extent == null) {
				let defaults = this.collectionDefaults(id);
				if (this.collection !== id) {
					this.max_spatial_extent = defaults.spatial_extent;
				}
				if (this.collection !== id || this.temporal_extent == null) {
					this.temporal_extent = defaults.temporal_extent;
				}
			}
			this.collection = id;
			this.parent.nextTab();
		},
		createProcess() {
			const b = new Builder(this.processes);
			let load = b.load_collection(this.collection, this.spatial_extent, this.temporal_extent);
			let save = b.save_result(load, this.format);
			save.result = true;
			return b.toJSON();
		},
		async finish() {
			this.$emit('input', {
				process: this.createProcess(),
				mode: this.mode,
				modeOptions: {
					title: this.jobTitle
				}
			});
		}
	}
}
</script>
