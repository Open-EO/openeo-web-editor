<template>
	<div class="budget">
		<input type="checkbox" v-model="hasBudget" :disabled="!editable" />
		<input type="number" min="0.00" :max="max" step="0.01" :disabled="!hasBudget || !editable" v-model.number="amount" />&nbsp;{{ capabilities.currency() }}
	</div>
</template>

<script>
import Utils from '../../utils';

export default {
	name: 'Budget',
	computed: {
		...Utils.mapState(['userInfo']),
		...Utils.mapGetters(['capabilities']),
		max() {
			if (this.userInfo.budget > 0) {
				return this.userInfo.budget;
			}
			else {
				return Number.MAX_VALUE;
			}
		}
	},
	props: {
		value: {
			type: Number,
			default: null
		},
		editable: {
			type: Boolean,
			default: true
		}
	},
	data() {
		return {
			hasBudget: (typeof this.value === 'number'),
			amount: this.value
		};
	},
	watch: {
		hasBudget() {
			this.updateData();
		},
		amount() {
			this.updateData();
		}
	},
	methods: {
		updateData() {
      		this.$emit('input', this.hasBudget && !Number.isNaN(this.amount) ? this.amount : null);
		}
	}
}
</script>