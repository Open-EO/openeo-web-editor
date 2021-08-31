<template>
	<div class="duration-picker">
		<div class="group">
			<label>Years</label>
			<input type="number" min="0" v-model="data.years" :disabled="!editable" @change="emit">
		</div>
		<div class="group">
			<label>Months</label>
			<input type="number" min="0" v-model="data.months" :disabled="!editable" @change="emit">
		</div>
		<div class="group">
			<label>Days</label>
			<input type="number" min="0" v-model="data.days" :disabled="!editable" @change="emit">
		</div>
		<div class="group">
			<label>Hours</label>
			<input type="number" min="0" v-model="data.hours" :disabled="!editable" @change="emit">
		</div>
		<div class="group">
			<label>Minutes</label>
			<input type="number" min="0" v-model="data.minutes" :disabled="!editable" @change="emit">
		</div>
		<div class="group">
			<label>Seconds</label>
			<input type="number" min="0" v-model="data.seconds" :disabled="!editable" @change="emit">
		</div>
	</div>
</template>

<script>
import { isoDuration } from '@musement/iso-duration';

const emptyObject = { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

export default {
	name: 'Duration',
	props: {
		value: {
			type: String,
			default: null
		},
		editable: {
			type: Boolean,
			default: true
		}
	},
	data() {
		return {
			data: emptyObject
		};
	},
	watch: {
		value: {
			immediate: true,
			handler(newVal, oldVal) {
				if (newVal !== oldVal) {
					return;
				}
				try {
					this.data = isoDuration(newVal).parse();
				} catch (error) {
					this.data = emptyObject;
				}
			}
		}
	},
	methods: {
		emit() {
			let iso = null;
			if (Object.values(this.data).find(num => num > 0)) {
				try {
					iso = isoDuration(this.data).toString();
				} catch(error) {}
			}
			this.$emit('input', iso);
		}
	}


}
</script>

<style lang="scss" scoped>
.duration-picker {
	display: flex;
	align-items: stretch;

	.group {
		box-sizing: border-box;
		padding: 0 0.25em;
		flex-grow: 1;
		display: flex;
		flex-direction: column-reverse;
	}

	label {
		display: block;
		text-align: center;
		font-size: 0.9em;
		color: #555;
		margin-top: 0.5em;
	}

	input {
		box-sizing: border-box;
		width: 100%;
		text-align: center;
		font-size: 1.5em;
		border: 0;
		padding: 0;
		padding-left: 0.5em;

		&:disabled {
			background-color: inherit;
		}
	}
}
</style>