<template>
	<div class="raster-image">
		<div class="ri-canvas">
			<canvas ref="canvas"></canvas>
		</div>
		<div class="ri-panel">
			<RasterStyle v-if="style" :value="style" :bands="bandNames" :hasPalette="Boolean(source.palette)" @input="setStyle" @auto="autoStretch" />
			<label v-if="source.times && source.times.length > 1" class="ri-time">
				<span>Time</span>
				<select v-model.number="time" @change="render">
					<option v-for="(t, i) in source.times" :key="i" :value="i">{{ formatTime(t) }}</option>
				</select>
			</label>
			<p class="ri-hint">This raster has no georeferencing and is shown in pixel space ({{ source.width }} x {{ source.height }}).</p>
		</div>
	</div>
</template>

<script>
import RasterStyle from './RasterStyle.vue';
import { defaultStyle } from './layers/rasterLayer';
import { colorize } from '../../data/render';
import { percentileRange } from '../../data/stats';
import { formatTime } from '../../data/time';
import Utils from '../../utils';

export default {
	name: 'RasterImage',
	components: {
		RasterStyle
	},
	props: {
		source: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			style: null,
			time: 0
		};
	},
	computed: {
		bandNames() {
			return this.source.bands.map(b => b.name);
		}
	},
	created() {
		this.data = null;
	},
	async mounted() {
		this.$emit('mounted', this);
		await this.render();
	},
	methods: {
		formatTime,
		async render() {
			try {
				this.data = await this.source.read({ bbox: this.source.bbox, maxWidth: 2048, maxHeight: 2048, time: this.time });
				let style = this.style || defaultStyle(this.source);
				const ranges = style.ranges.slice();
				this.data.bands.forEach((band, i) => {
					if (!ranges[i]) {
						ranges[i] = percentileRange(band) || [0, 1];
					}
				});
				this.style = { ...style, ranges };
				this.draw();
			} catch (error) {
				Utils.exception(this, error);
			}
		},
		draw() {
			const { width, height, bands } = this.data;
			const canvas = this.$refs.canvas;
			canvas.width = width;
			canvas.height = height;
			canvas.getContext('2d').putImageData(colorize(bands, width, height, { ...this.style, palette: this.source.palette }), 0, 0);
		},
		setStyle(style) {
			this.style = style;
			this.draw();
		},
		autoStretch() {
			const ranges = this.style.ranges.slice();
			const indices = this.style.mode === 'rgb' ? this.style.rgb : [this.style.band];
			indices.forEach(i => ranges[i] = percentileRange(this.data.bands[i]) || ranges[i]);
			this.setStyle({ ...this.style, ranges });
		}
	}
};
</script>

<style lang="scss" scoped>
.raster-image {
	display: flex;
	height: 100%;
	width: 100%;

	.ri-canvas {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 20px 20px;
		overflow: hidden;

		canvas {
			max-width: 100%;
			max-height: 100%;
			image-rendering: pixelated;
		}
	}

	.ri-panel {
		width: 15em;
		padding: 0.5em;
		font-size: 0.85em;
		border-left: 1px solid #ddd;
		overflow-y: auto;
	}

	.ri-time {
		display: flex;
		gap: 0.4em;
		margin-top: 0.5em;
	}

	.ri-hint {
		color: #666;
	}
}
</style>
