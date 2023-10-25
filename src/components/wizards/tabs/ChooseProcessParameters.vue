<template>
	<div class="step choose-process-parameters">
		<p v-if="parameters.length === 0">
			This process doesn't expose any parameters.
			You can skip this step.
		</p>
		<Parameters v-else v-model="value" :parameters="parameters" :parent="process" />
	</div>
</template>

<script>
import { ProcessParameter } from '@openeo/js-commons';
import Parameters from '../../Parameters.vue';
import Utils from '../../../utils';

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
			if (!Utils.isObject(this.process) || !Array.isArray(this.process.parameters)) {
				return [];
			}
			return this.process.parameters.map(p => new ProcessParameter(p)).filter(p => p.isEditable());
		}
	}
}
</script>