<template>
	<div class="step choose-time">
		<p>{{ description }}</p>
		<SelectBox :options="selectOptions" :value="value" @input="v => $emit('input', v)" />
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
		},
		options: {
			type: Array,
			default: null
		}
	},
	computed: {
		selectOptions() {
			if (!Array.isArray(this.options)) {
				return [];
			}
			let options = this.options.map(value => {
				return {
					id: [value, value], // todo: This will fail if the actual values are not just years, dates or date-time (e.g. "2020-01" would fail)
					label: value
				}
			});
			options.unshift({id: null, label: "All"});
			return options;
		},
		description() {
			if (this.options) {
				return 'Please select the timestamp for which you want to donwload data for.';
			}
			else {
				return 'Please select the days for which you want to download data for.'
			}
		}
	}
}
</script>