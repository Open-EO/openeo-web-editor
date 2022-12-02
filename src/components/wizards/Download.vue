<template>
	<div class="wizard-tab-content">
		<WizardTab :pos="0" :parent="parent" title="Data Source" :beforeChange="() => collection !== null">
			<ChooseCollection :value="collection" @input="submit" />
		</WizardTab>
		<WizardTab :pos="1" :parent="parent" title="Location" :beforeChange="() => bbox !== null">
			<ChooseBoundingBox v-model="bbox"/>
		</WizardTab>
		<WizardTab :pos="2" :parent="parent" title="Temporal Coverage">
			Choose temporal extent
		</WizardTab>
		<WizardTab :pos="3" :parent="parent" title="File Format">
			Choose file format
		</WizardTab>
		<WizardTab :pos="4" :parent="parent" title="Finish">
			Insert or run (sync / batch)
		</WizardTab>
	</div>
</template>

<script>
import ChooseCollection from './tabs/ChooseCollection.vue';
import WizardTab from './components/WizardTab.vue';
import ChooseBoundingBox from './tabs/ChooseBoundingBox.vue';

export default {
	name: "Download",
	components: {
		ChooseCollection,
		ChooseBoundingBox,
		WizardTab
	},
	props: {
		parent: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			collection: null,
			bbox: null
		};
	},
	methods: {
		submit(id) {
			this.collection = id;
			this.parent.nextTab();
		}
	}
}
</script>
