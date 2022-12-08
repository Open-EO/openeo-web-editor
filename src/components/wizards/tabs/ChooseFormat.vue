<template>
	<div class="step choose-format">
		<p>Please select the file format you want to download data in.</p>
		<SelectBox type="output-format" :value="value" @input="v => $emit('input', v)" />
	</div>
</template>

<script>
import SelectBox from '../../datatypes/SelectBox.vue';

export default {
	name: 'ChooseTime',
	components: {
		SelectBox
	},
	props: {
		value: {
			type: String,
			default: null
		}
	}
}
</script>