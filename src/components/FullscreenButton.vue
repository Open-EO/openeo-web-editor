<template>
	<BButton v-show="element" @click="toggleFullscreen" :title="isFullscreen ? 'Close fullscreen' : 'Show fullscreen'">
		<span v-show="isFullscreen"><i class="fas fa-compress"></i></span>
		<span v-show="!isFullscreen"><i class="fas fa-expand"></i></span>
	</BButton>
</template>

<script>
import EventBusMixin from './EventBusMixin.js';
import Utils from '../utils.js';
import BButton from '@openeo/vue-components/components/internal/BButton.vue';

export default {
	name: 'FullscreenButton',
	mixins: [EventBusMixin],
	components: {
		BButton
	},
	props: {
		element: {
			required: true
		}
	},
	data() {
		return {
			isFullscreen: false,
			keyDownFn: null,
			oldZIndex: 'auto'
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
	computed: {
		...Utils.mapState('editor', ['hightestModalZIndex'])
	},
	methods: {
		...Utils.mapMutations('editor', ['openModal', 'closeModal']),
		onkeyDown(e) {
			// ToDo: This is very bugged and needs some attention
			if(this.isFullscreen && (e.key === "F11" || e.key === "Escape")) {
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
				// Handle z-index to properly show above modals etc.
				this.openModal();
				this.oldZIndex = el.style.zIndex;
				el.style.zIndex = this.hightestModalZIndex;
			}
			else {
				this.isFullscreen = false;
				el.classList.remove('fullscreen');
				// Revert z-index changes
				el.style.zIndex = this.oldZIndex;
				this.closeModal();
			}

			this.$emit('changed', this.isFullscreen);
			this.broadcast('stopTour');
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
	background-color: white;
	overflow: auto;
}
</style>