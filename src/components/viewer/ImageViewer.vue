<template>
	<div class="imageViewer" ref="imageViewer" :class="{'fullscreen': fullScreen}">
		<template v-if="error">{{ error }}</template>
		<template v-else>
			<div class="toolbar">
				<span v-if="!play" class="value" :title="valueTitle">{{ valueText }}</span>
				<FullscreenButton class="fullscreen-button" :element="() => $refs.imageViewer" @changed="fullscreenToggled" />
				<button class="play-button" @click.prevent.stop="togglePlay" title="Play animation (if available)">
					<i v-if="play" class="fas fa-stop"></i>
					<i v-else class="fas fa-play"></i>
				</button>
			</div>
			<div v-show="!context" class="no-data"><i class="fas fa-spinner fa-spin"></i> Loading image...</div>
			<canvas v-show="context && !play" ref="canvas" :style="style" :title="title" @click.prevent.stop="resize" @mousemove="getPixelValue" @mouseout="resetPixelValue" />
			<iframe v-show="context && play" ref="iframe">
				<body style="margin: auto; width: 100%; height: 100%; text-align: center;" ref="body">
					<img ref="image" :style="style" :title="title" @click.prevent.stop="resize" />
				</body>
			</iframe>
		</template>
	</div>
</template>

<script>
import FullscreenButton from '../FullscreenButton.vue';

const unknown = '-';

export default {
	name: 'ImageViewer',
	components: {
		FullscreenButton
	},
	props: {
		data: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			fullScreen: false,
			fullSize: false,
			img: null,
			error: null,
			context: null,
			value: unknown,
			play: false
		};
	},
	async mounted() {
		this.$emit('mounted', this);
		this.img = await this.data.getData();
	},
	computed: {
		style() {
			if (this.fullSize || this.fullScreen) {
				return {
					"max-width": "none",
					"max-height": "none",
					"object-fit": "none",
					"cursor": this.fullScreen ? "auto" : "zoom-out",
					"box-sizing": "border-box"
				};
			}
			else {
				return {
					"max-width": "100%",
					"max-height": "100%",
					"cursor": "zoom-in",
					"object-fit": "contain",
					"box-sizing": "border-box"
				};
			}
		},
		title() {
			if (this.fullScreen) {
				return "";
			}
			return this.fullSize ? "Click to shrink (fit to screen)" : "Click to enlarge (full size)";
		},
		valueTitle() {
			return (this.fullScreen || this.fullSize) ? "" : "Show in full size to get precise values";
		},
		valueText() {
			if (this.fullScreen || this.fullSize) {
				return `Pixel Value: ${this.value}`;
			}
			else {
				return `Estimated Pixel Value: ${this.value}`;
			}
		}
	},
	watch: {
		img: {
			immediate: true,
			handler() {
				this.updateContent();
			}
		},
		play: {
			immediate: true,
			handler() {
				this.updateContent();
			}
		}
	},
	methods: {
		updateContent() {
			if (!this.img) {
				return;
			}
			try {
				if (this.play) {
					this.$refs.image.src = this.img.src;
					this.$refs.iframe.contentWindow.document.body = this.$refs.body;
					this.$refs.iframe.style.width = `${this.img.naturalWidth}px`;
					this.$refs.iframe.style.height = `${this.img.naturalHeight}px`;
				}
				else {
					this.$refs.canvas.width = this.img.naturalWidth;
					this.$refs.canvas.height = this.img.naturalHeight;
					this.context = this.$refs.canvas.getContext('2d', {willReadFrequently: true});
					this.context.drawImage(this.img, 0, 0);
				}
			} catch (error) {
				this.error = error;
			}
		},
		togglePlay() {
			this.play = !this.play;
		},
		fullscreenToggled(open) {
			this.fullScreen = open;
		},
		resize() {
			if (!this.fullScreen) {
				this.fullSize = !this.fullSize;
			}
		},
		resetPixelValue() {
			this.value = unknown;
		},
		getPixelValue(event) {
			try {
				const size = this.$refs.canvas.getBoundingClientRect();
				const xScale = this.img.naturalWidth / size.width;
				const yScale = this.img.naturalHeight / size.height;
				const x = event.offsetX * xScale;
				const y = event.offsetY * yScale;
				const rgba = Array.from(this.context.getImageData(Math.ceil(x), Math.ceil(y), 1, 1).data);
				const alpha = rgba.pop();
				// Fully transparent
				if (alpha === 0) {
					this.value = 'no data';
				}
				// Grayscale (all values are the same)
				else if (rgba.every(v => v === rgba[0])) {
					this.value = rgba[0];
				}
				// RGB and others
				else {
					this.value = rgba.join(' / ');
				}
			} catch (error) {
				this.value = unknown;
			}
		}
	}
};
</script>

<style scoped>
.imageViewer {
	position: relative;
	width: 100%;
	height: 100%;
	text-align: center;
	background-color: #eee;
	overflow: auto;
}
.toolbar {
	z-index: 1;
  position: sticky;
	top: 0;
	left: 0;
	width: 100%;
	height: 3em;
	padding: 1em;
	box-sizing: border-box;
	text-align: left;
}
.fullscreen-button,
.play-button {
	float: right;
}
.play-button {
	margin-right: 0.5em;
}
.value {
	display: inline-block;
	background-color: rgba(255,255,255, 0.5);
	border-radius: 5px;
	padding: 5px;
	margin: -5px;
}
iframe, canvas {
	border: none;
	margin-top: -3em !important;
	max-width: 100%;
	max-height: 100%;
	margin: auto;
	cursor: zoom-in;
	object-fit: contain;
	box-sizing: border-box;
}
canvas.fullsize,
iframe.fullsize,
.fullscreen canvas,
.fullscreen iframe {
	max-width: none;
	max-height: none;
	object-fit: none;
	cursor: zoom-out;
}
</style>