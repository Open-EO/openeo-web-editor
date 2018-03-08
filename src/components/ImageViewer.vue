<template>
	<div id="imageViewer" ref="imageContainer">
		<span ref="emptyMsg" v-show="visibleContent == 'text'"></span>
		<canvas ref="canvas" v-show="visibleContent == 'canvas'"></canvas>
		<img ref="image" v-show="visibleContent == 'image'" />
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

		setScript(script) {
			this.script = script;
		},

		reset() {
			this.setMessage('Nothing to show.');
		},

		setMessage(message) {
			this.$refs.emptyMsg.innerText = message;
			this.visibleContent = 'text';
			this.setCanvasSize(0, 0);
		},
		
		showImage(src) {
			this.setMessage('Loading image...');
			EventBus.$emit('showImageViewer');
			this.$refs.image.onload = () => {
				this.visibleContent = 'image';
				if (this.script.Visualization && this.script.Visualization.function) {
					this.updateCanvas();
				}
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

		updateCanvas() {
			this.setCanvasSize(this.$refs.image.naturalWidth, this.$refs.image.naturalHeight);

			var context = this.$refs.canvas.getContext('2d');
			context.drawImage(this.$refs.image, 0, 0);
			this.$refs.canvas.originalImage = context.getImageData(0, 0, this.$refs.canvas.width, this.$refs.canvas.height);
			this.$utils.recolorImage(this.$refs.canvas, this.script);

			this.visibleContent = 'canvas';
		},

		setCanvasSize(w, h) {
			this.$refs.canvas.width = this.$refs.image.naturalWidth;
			this.$refs.canvas.height = this.$refs.image.naturalHeight;

		}

	}
};
</script>

<style>
#imageViewer {
	padding: 5px;
}
</style>