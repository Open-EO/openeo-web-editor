<template>
	<div class="datatypeEditor fieldValue temporalPicker">
		<!-- ToDo: Support open date ranges, probably by using two separate date pickers -->
		<DatePicker :key="type" v-model="dateTimes" :disabled ="!editable" :range="range" :placeholder="label" :format="formatUi" :type="pickerType" :showSecond="false" :value-type="formatApi"></DatePicker>
	</div>
</template>

<script>
import DatePicker from 'vue2-datepicker';
import 'vue2-datepicker/index.css';
import SelectBox from './SelectBox.vue';

export default {
	name: 'TemporalPicker',
	components: {
		DatePicker,
		SelectBox
	},
	props: {
		value: {
			type: [String, Array]
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
		formatApi() {
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
		formatUi() {
			switch(this.type) {
				case 'date':
					return 'YYYY-MM-DD';
				case 'date-time':
				case 'temporal-interval':
					return 'YYYY-MM-DD HH:mm';
				case 'time':
					return 'HH:mm';
			}
		},
		label() {
			switch(this.type) {
				case 'date': // Single date
					return 'Select date';
				case 'date-time': // Single date and time
					return 'Select date and time';
				case 'temporal-interval':
					return 'Select start and end time';
				case 'time': // Single time
					return 'Select time';
			}
		},
		range() {
			return (this.type === 'temporal-interval');
		},
		pickerType() {
			switch(this.type) {
				case 'temporal-interval':
				case 'date-time':
					return 'datetime';
				default:
					return this.type;
			}
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
				this.dateTimes = newValue;
			}
		},
		dateTimes(value) {
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