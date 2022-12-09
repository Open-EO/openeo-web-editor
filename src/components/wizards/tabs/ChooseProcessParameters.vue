<template>
	<div class="step choose-process-parameters">
		<p v-if="process.parameters.length === 0">No editable parameters available.</p>
		<Parameters v-else v-model="value" :parameters="parameters" :parent="process" />
	</div>
</template>

<script>
import { ProcessParameter } from '@openeo/js-commons';
import Parameters from '../../Parameters.vue';

export default {
	name: 'ChooseProcessParameters',
	components: {
		Parameters
	},
	props: {
		process: {
			type: Object,
			required: true
		},
		value: {
			type: Object,
			required: true
		}
	},
	computed: {
		parameters() {
			return this.process.parameters.map(p => new ProcessParameter(p)).filter(p => p.isEditable());
		}
	}
}
</script>