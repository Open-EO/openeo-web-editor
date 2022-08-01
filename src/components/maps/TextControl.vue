<template>
	<div v-if="texts.length > 0" class="ol-unselectable ol-control value" @click="toggle" :class="{pointer: texts.length > 1}">
		{{ current }}
	</div>
</template>

<script>
import ControlMixin from './ControlMixin.vue';

export default {
	name: 'TextControl',
	mixins: [
		ControlMixin
	],
	data() {
		return {
			i: 0
		};	
	},
	computed: {
		texts() {
			if (Array.isArray(this.text)) {
				return this.text;
			}
			else if (typeof this.text === 'string' && this.text.length > 0) {
				return [this.text];
			}
			return [];
		},
		current() {
			if (this.texts.length === 0) {
				return "";
			}
			else {
				return this.texts[this.i % this.text.length];
			}
		}
	},
	props: {
		text: {
			text: [
				String,
				Array
			],
			default: ''
		}
	},
	methods: {
		toggle() {
			this.i++;
		}
	}
}
</script>

<style lang="scss" scoped>
.pointer {
	cursor: pointer;
}
</style>