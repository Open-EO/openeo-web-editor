<template>
	<div id="imageViewer" ref="imageContainer">
		<span ref="emptyMsg" v-show="visibleContent == 'text'"></span>
		<img ref="image" v-show="visibleContent == 'image'" title="Click to enlarge" style="max-width: 100%" @click="resize" />
	</div>
</template>

<script>
import EventBus from '../eventbus.js';

export default {
	name: 'ImageViewer',

	data() {
		return {
			script: null,
			visibleContent: 'text'
		};
	},

	mounted() {
		this.reset();
	},

	methods: {

		reset() {
			this.setMessage('Nothing to show.');
		},

		setMessage(message) {
			this.$refs.emptyMsg.innerText = message;
			this.visibleContent = 'text';
		},
		
		showImage(src) {
			this.setMessage('Loading image...');
			EventBus.$emit('showImageViewer');
			this.$refs.image.onload = () => {
				this.visibleContent = 'image';
			};
			this.$refs.image.src = src;
		},

		showImageBlob(data) {
			this.showImage(URL.createObjectURL(data));
		},

		showImageBase64(data) {
			var base64 = "data:" + contentType + ";base64," + btoa(data);
			this.showImage(data);
		},

		resize() {
			if (this.$refs.image.style.maxWidth) {
				this.$refs.image.style.maxWidth = null;
				this.$refs.image.title = "Click to shrink (fit to screen)";
			}
			else {
				this.$refs.image.style.maxWidth = "100%";
				this.$refs.image.title = "Click to enlarge";
			}
		}

	}
};
</script>

<style>
#imageViewer {
	padding: 5px;
}
</style>