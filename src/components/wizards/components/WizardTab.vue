<template>
	<div v-if="active" class="wizard-tab-container">
		<slot :active="active">
		</slot>
	</div>
</template>
<script>
	export default{
		name: 'WizardTab',
		props: {
			parent: {
				type: Object,
				required: true
			},
			pos: {
				type: Number,
				required: true
			},
			title: {
				type: String,
				default: ''
			},
			/***
			 * Function to execute before tab switch. Return value must be boolean
			 * If the return result is false, tab switch is restricted
			 */
			beforeChange: {
				type: Function
			},
			 /***
			 * Function to execute after tab switch. Return void for now.
			 * Safe to assume necessary validation has already occured
			 */
			afterChange: {
				type: Function
			}
		},
		data () {
			return {
				active: false,
				validationError: null,
				checked: false
			}
		},
		mounted() {
			this.parent.addTab(this, this.pos);
		},
		beforeDestroy() {
			this.parent.removeTab(this);
		}
	}
</script>