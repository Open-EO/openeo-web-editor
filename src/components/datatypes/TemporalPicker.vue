<template>
	<div class="datatypeEditor fieldValue temporalPicker">
		<template v-if="type === 'temporal-interval'">
			<DatePicker v-model="dateTimes[0]" :get-classes="getRangeClasses" :default-value="defaultStart" :disabled-date="disabledStartDate" :disabled-time="disabledStartTime" :placeholder="label[0]" :type="pickerType" :value-type="formatApi"></DatePicker>
			&nbsp;
			<DatePicker v-model="dateTimes[1]" :get-classes="getRangeClasses" :default-value="defaultEnd" :disabled-date="disabledEndDate" :disabled-time="disabledEndTime" :placeholder="label[1]" :type="pickerType" :value-type="formatApi"></DatePicker>
		</template>
		<DatePicker v-else :key="type" v-model="dateTimes" :disabled ="!editable" :placeholder="label" :format="formatUi" :type="pickerType" :showSecond="false" :value-type="formatApi"></DatePicker>
	</div>
</template>

<script>
import DatePicker from 'vue2-datepicker';
import 'vue2-datepicker/index.css';

export default {
	name: 'TemporalPicker',
	components: {
		DatePicker
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
		defaultStart() {
			return this.newDate(this.dateTimes[0] || Date.now());
		},
		defaultEnd() {
			return this.newDate(this.dateTimes[1] || Date.now());
		},
		realType() {
			if (this.type === 'temporal-interval') {
				let checkDate = dt => (typeof dt === 'string' && dt.length === 10);
				let containsDate;
				if (Array.isArray(this.value)) {
					containsDate = !!this.value.find(checkDate);
				}
				else {
					containsDate = checkDate(this.value);
				}
				return containsDate ? 'date' : 'date-time';
			}
			else {
				return this.type;
			}
		},
		formatApi() {
			switch(this.realType) {
				case 'date':
					return 'YYYY-MM-DD';
				case 'date-time':
					return 'YYYY-MM-DD[T]HH:mm:ss[Z]';
				case 'time':
					return 'HH:mm:ss[Z]';
			}
		},
		formatUi() {
			switch(this.realType) {
				case 'date':
					return 'YYYY-MM-DD';
				case 'date-time':
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
					let openRange = this.dateTimes[0] || this.dateTimes[1];
					return [
						openRange ? 'Open-ended interval': 'Select start time',
						openRange ? 'Open-ended interval': 'Select end time'
					];
				case 'time': // Single time
					return 'Select time';
			}
		},
		pickerType() {
			switch(this.realType) {
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
				if (this.type === 'temporal-interval' && (!Array.isArray(newValue) || newValue.length < 2)) {
					this.dateTimes = [null, null];
				}
				else {
					this.dateTimes = newValue;
				}
			}
		},
		dateTimes(value) {
			if (this.type === 'temporal-interval' && value[0] === null && value[1] === null) {
				value = null;
			}
      		this.$emit('input', value);
		}
	},
	methods: {
		newDate(date) {
			return new Date(date).setHours(0, 0, 0, 0);
		},
		getRangeClasses(cellDate, currentDates, classnames) {
			const classes = [];
			const start = this.dateTimes[0] && this.newDate(this.dateTimes[0]);
			const end = this.dateTimes[1] && this.newDate(this.dateTimes[1]);
			if (
				!/disabled|active|not-current-month/.test(classnames) &&
				start && end &&
				cellDate.getTime() >= start && cellDate.getTime() <= end
			) {
				classes.push("in-range");
			}
			return classes;
		},
		disabledStartDate(date) {
			return (this.dateTimes[1] && this.newDate(date) > this.newDate(this.dateTimes[1]));
		},
		disabledEndDate(date) {
			return (this.dateTimes[0] && this.newDate(date) < this.newDate(this.dateTimes[0]));
		},
		disabledStartTime(date) {
			return this.dateTimes[1] && date > this.dateTimes[1];
		},
		disabledEndTime(date) {
			return this.dateTimes[0] && date < this.dateTimes[0];
		}
	}
}
</script>

<style>
.datepicker button {
	margin: 0px;
}
</style>