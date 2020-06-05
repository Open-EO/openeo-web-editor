<template>
	<div class="datatypeEditor fieldValue temporalPicker">
		<SelectBox v-if="type === 'year'" :key="type" v-model="dateTimes" :type="type" :editable="editable" />
		<!-- ToDo: Support open date ranges, probably by using two separate date pickers, see also https://github.com/chronotruck/vue-ctk-date-time-picker/issues/121 -->
		<VueCtkDateTimePicker v-else :key="type" v-model="dateTimes" :disabled="!editable" :range="range" :label="label" :format="format" :only-date="onlyDate" :only-time="onlyTime" :no-button="!range" :formatted="formatted" locale="en-gb" position="bottom"></VueCtkDateTimePicker>
	</div>
</template>

<script>
import VueCtkDateTimePicker from 'vue-ctk-date-time-picker';
import 'vue-ctk-date-time-picker/dist/vue-ctk-date-time-picker.css';
import SelectBox from './SelectBox.vue';
import Utils from '../../utils';

export default {
	name: 'TemporalPicker',
	components: {
		VueCtkDateTimePicker,
		SelectBox
	},
	props: {
		value: {
			type: String | Array
		},
		type: {
			type: String
		},
		editable: {
			type: Boolean,
			default: true
		}
	},
	computed: {
		format() {
			switch(this.type) {
				case 'date':
					return 'YYYY-MM-DD';
				case 'date-time':
				case 'temporal-interval':
					return 'YYYY-MM-DD[T]HH:mm:ss[Z]';
				case 'time':
					return 'HH:mm:ss[Z]';
			}
		},
		formatted() {
			switch(this.type) {
				case 'date':
					return 'll';
				case 'time':
					return 'LT';
				default:
					return 'llll';
			}
		},
		label() {
			switch(this.type) {
				case 'date': // Single date
					return 'Select date';
				case 'date-time': // Single date and time
					return 'Select date and time';
				case 'temporal-interval': // Multiple dates (ToDo: Also allow times)
					return 'Select start and end time';
				case 'time': // Single time
					return 'Select time';
			}
		},
		range() {
			return (this.type === 'temporal-interval');
		},
		onlyTime() {
			return (this.type === 'time');
		},
		onlyDate() {
			return (this.type === 'date');
		}
	},
	data() {
		let value = this.value;
		if (this.type === 'temporal-interval') {
			if (Array.isArray(value) && value.length >= 2) {
				value = {
					start: value[0],
					end: value[1]
				};
			}
			else if (!Utils.isObject(value) || !value.start || !value.end) {
				value = null;
			}
		}
		return {
			dateTimes: value
		};
	},
	watch: {
		dateTimes() {
			let value = this.dateTimes;
			if (this.type === 'temporal-interval') {
				value = [value.start, value.end];
			}
      		this.$emit('input', value);
		}
	}
}
</script>

<style>
.datepicker button {
	margin: 0px;
}
</style>