<template>
	<div class="datatypeEditor fieldValue temporalPicker">
		<SelectBox v-if="type === 'year'" :key="type" v-model="dateTimes" :type="type" :editable="editable" />
		<!-- ToDo: Support open date ranges, probably by using two separate date pickers, see also https://github.com/chronotruck/vue-ctk-date-time-picker/issues/121 -->
		<VueCtkDateTimePicker v-else :key="type" :value="dateTimes" @input="importValue" :disabled="!editable" :range="range" :label="label" :format="format" :only-date="onlyDate" :only-time="onlyTime" :no-button="!range" :formatted="formatted" locale="en-gb" position="bottom"></VueCtkDateTimePicker>
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
		},
		exportValue() {
			let value = this.dateTimes;
			if (Utils.isObject(value) && this.type === 'temporal-interval') {
				value = [value.start, value.end];
			}
			return value;
		}
	},
	data() {
		return {
			dateTimes: null
		};
	},
	watch: {
		value: {
			immediate: true,
			handler(newValue) {
				if (this.exportValue !== newValue) {
					this.importValue(newValue);
				}
			}
		},
		dateTimes() {
      		this.$emit('input', this.exportValue);
		}
	},
	errorCaptured(err, vm, info) {
		// Catch errors thrown by VueCtkDateTimePicker
		if (vm.value === 'Invalid date') {
			this.dateTimes = null;
			return false;
		}
		return true;
	},
	methods: {
		importValue(value) {
			switch(this.type) {
				case 'temporal-interval':
					if (Array.isArray(value) && value.length >= 2) {
						value = {
							start: value[0],
							end: value[1]
						};
					}
					else if (!Utils.isObject(value) || !value.start || !value.end) {
						value = null;
					}
					break;
				case 'date':
				case 'date-time':
					if (Date.parse(value) === NaN) {
						value = null;
					}
					break;
				case 'time':
					if (typeof value !== 'string') {
						value = null;
					}
					break;
			}
			this.dateTimes = value;
		}
	}
}
</script>

<style>
.datepicker button {
	margin: 0px;
}
</style>