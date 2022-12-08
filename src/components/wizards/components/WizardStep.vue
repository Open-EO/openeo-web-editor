<template>
	<li :class="{active: tab.active, error: tab.validationError, checked: tab.checked}">
		<a href="javascript:void(0)" :class="{disabled: !tab.checked}">
			<div class="wizard-icon-circle" :tabindex="tab.checked ? 0 : ''">
				<transition mode="out-in">
						<div v-if="tab.active" class="wizard-icon-container">
								<i class="wizard-icon">{{index + 1}}</i>
						</div>
						<i v-else class="wizard-icon">{{index + 1}}</i>
				</transition>
			</div>
	  <span class="stepTitle">{{tab.title}}</span>
		</a>
	</li>
</template>
<script>
	export default {
		name: 'wizard-step',
		props: {
			tab: {
				type: Object,
				required: true
			},
			index: {
				type: Number,
				required: true
			}
		}
	}
</script>