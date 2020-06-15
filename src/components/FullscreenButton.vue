<template>
	<button type="button" @click="toggleFullscreen" :title="isFullscreen ? 'Close fullscreen' : 'Show fullscreen'">
		<span v-show="isFullscreen"><i class="fas fa-compress"></i></span>
		<span v-show="!isFullscreen"><i class="fas fa-expand"></i></span>
	</button>
</template>

<script>
import Utils from '../utils.js';

// ToDo: Add key listeners for F11(?) and ESC (closing)
export default {
	name: 'FullscreenButton',
	props: {
		element: Object | Function | String
	},
	data() {
		return {
			isFullscreen: false,
			keyDownFn: null
		};
	},
	mounted() {
		this.keyDownFn = this.onkeyDown.bind(this);
		let el = this.getElement();
		if (el) {
			el.addEventListener('keydown', this.keyDownFn);
		}
	},
    beforeDestroy() {
		let el = this.getElement();
		if (el) {
			el.removeEventListener('keydown', this.keyDownFn);
		}
    },
	methods: {
		onkeyDown(e) {
			// ToDo: This is very bugged and needs some attention
			if(e.key === "F11" || (this.isFullscreen && e.key === "Escape")) {
				this.toggleFullscreen();
				e.preventDefault();
				e.stopPropagation();
    		}
		},
		getElement() {
			if (typeof this.element === 'string') {
				return document.querySelector(this.element);
			}
			else if (typeof this.element === 'function') {
				return this.element();
			}
			else {
				return this.element;
			}
		},
		toggleFullscreen() {
			let el = this.getElement();
			if (!this.isFullscreen) {
				this.isFullscreen = true;
				el.classList.add('fullscreen');
			}
			else {
				this.isFullscreen = false;
				el.classList.remove('fullscreen');
			}

			this.$emit('changed', this.isFullscreen);
		},
	}
};
</script>

<style>
.fullscreen {
	position: absolute !important;
	top: 0 !important;
	left: 0 !important;
	width: 100% !important;
	height: 100% !important;
	z-index: 9990 !important; /* Snotify has 9999 and is intentionally above the fullscreen */
	background-color: white;
	overflow: auto;
}
</style>