<template>
	<div class="imageViewer" ref="imageContainer">
		<div ref="loading" class="noDataMessage"><i class="fas fa-spinner fa-spin"></i> Loading image...</div>
		<img ref="image" @click="resize" alt="" />
	</div>
</template>

<script>
export default {
	name: 'ImageViewer',
	props: {
		data: {
			type: Object,
			required: true
		}
	},
	mounted() {
		if (this.data.blob) {
			this.showImageBlob(this.data.blob);
		}
		else if (this.data.url) {
			this.showImage(this.data.url);
		}
		this.resize();
	},
	methods: {
		showImage(src) {
			this.$refs.image.src = src;
			this.$refs.image.onload = () => {
				this.$refs.loading.style.display = 'none';
			};
		},
		showImageBlob(data) {
			this.showImage(URL.createObjectURL(data));
		},
		resize() {
			if (!this.$refs.image) {
				return;
			}
			if (this.$refs.image.style.maxWidth) {
				this.$refs.image.style.maxWidth = null;
				this.$refs.image.style.cursor = 'zoom-out';
				this.$refs.image.title = "Click to shrink (fit to screen)";

			}
			else {
				this.$refs.image.style.maxWidth = "100%";
				this.$refs.image.style.cursor = 'zoom-in';
				this.$refs.image.title = "Click to enlarge";
			}
		}
	}
};
</script>

<style scoped>
.imageViewer {
	position: relative;
}
.imageViewer .noDataMessage {
	z-index: 0;
    position: absolute;
    top: 0;
    left: 0;
	width: 100%;
	margin-left: 0;
	margin-right: 0;
}
.imageViewer img {
	z-index: 1;
}
</style>