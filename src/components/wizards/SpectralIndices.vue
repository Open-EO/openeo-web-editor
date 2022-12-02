<template>
	<div class="wizard-tab-content">
		<WizardTab :pos="0" :parent="parent" title="Data Source">
			<ChooseCollection :value="collection" @input="submit" :beforeChange="() => collection !== null" />
		</WizardTab>
		<WizardTab :pos="1" :parent="parent" title="Location">
			Choose spatial extent
		</WizardTab>
		<WizardTab :pos="2" :parent="parent" title="Temporal Coverage">
			Choose temporal extent
		</WizardTab>
		<WizardTab :pos="3" :parent="parent" title="Spectral Index">
			Choose file format
		</WizardTab>
		<WizardTab :pos="4" :parent="parent" title="Time Composite">
			Choose file format
		</WizardTab>
		<WizardTab :pos="5" :parent="parent" title="File Format">
			Choose file format
		</WizardTab>
		<WizardTab :pos="6" :parent="parent" title="Finish">
			Insert or run (sync / batch)
		</WizardTab>
	</div>
</template>

<script>
import ChooseCollection from './tabs/ChooseCollection.vue';
import WizardTab from './components/WizardTab.vue';

export default {
	name: "SpectralIndices",
	components: {
		ChooseCollection,
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
			collection: null
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
