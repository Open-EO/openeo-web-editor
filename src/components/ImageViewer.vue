<template>
	<div id="imageViewer" ref="image"></div>
</template>

<script>
import EventBus from '../eventbus.js';

export default {
	name: 'ImageViewer',

	mounted() {
		this.reset();
	},

	methods: {

		reset() {
			this.$refs.image.innerText = 'Nothing to show.';
		},
		
		showImage(src) {
			this.$refs.image.innerHTML = '<img src="' + src + '" />';
			EventBus.$emit('showImageViewer');
		},

		showImageBlob(data) {
			this.showImage(URL.createObjectURL(data));
		},

		showImageBase64(data) {
			var base64 = "data:" + contentType + ";base64," + btoa(data);
			this.showImage(data);
		}

	}
};
</script>

<style>
#imageViewer {
	padding: 5px;
}
#imageViewer img {
	display: block;
	margin: auto;
}
</style>