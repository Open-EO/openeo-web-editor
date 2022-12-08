<template>
	<div class="step choose-time">
		<p>Please select the days for which you want to download data for.</p>
		<TemporalPicker type="temporal-interval" intervalType="date" :value="value" @input="v => $emit('input', v)" />
	</div>
</template>

<script>
import TemporalPicker from '../../datatypes/TemporalPicker.vue';

export default {
	name: 'ChooseTime',
	components: {
		TemporalPicker
	},
	props: {
		value: {
			type: Array,
			default: null
		}
	}
}
</script>