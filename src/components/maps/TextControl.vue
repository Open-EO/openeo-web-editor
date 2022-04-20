<template>
	<div v-if="text" class="ol-unselectable ol-control value" :title="tooltip">
		{{ text }}
	</div>
</template>

<script>
import ControlMixin from './ControlMixin.vue';

export default {
	name: 'TextControl',
	mixins: [
		ControlMixin
	],
	props: {
		text: {
			text: String,
			default: ''
		},
		tooltip: {
			text: String,
			default: null
		}
	}
}
</script>