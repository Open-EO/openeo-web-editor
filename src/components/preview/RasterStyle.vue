<template>
	<div class="raster-style">
		<label class="rs-row">
			<span>Display</span>
			<select :value="value.mode" @change="update({ mode: $event.target.value })">
				<option value="single">Single band</option>
				<option value="rgb" :disabled="bands.length < 2">RGB composite</option>
				<option v-if="hasPalette" value="palette">Color table</option>
			</select>
		</label>
		<template v-if="value.mode === 'rgb'">
			<div v-for="(channel, c) in channels" :key="channel" class="rs-channel">
				<label class="rs-row">
					<span :class="['rs-swatch', channel]">{{ channel[0].toUpperCase() }}</span>
					<select :value="value.rgb[c]" @change="setRgb(c, $event.target.value)">
						<option v-for="(band, i) in bands" :key="i" :value="i">{{ band }}</option>
					</select>
				</label>
				<div class="rs-range">
					<input type="number" step="any" :value="rangeOf(value.rgb[c])[0]" @change="setRange(value.rgb[c], 0, $event.target.value)" title="Minimum" />
					<input type="number" step="any" :value="rangeOf(value.rgb[c])[1]" @change="setRange(value.rgb[c], 1, $event.target.value)" title="Maximum" />
				</div>
			</div>
		</template>
		<template v-else>
			<label class="rs-row">
				<span>Band</span>
				<select :value="value.band" @change="update({ band: Number($event.target.value) })">
					<option v-for="(band, i) in bands" :key="i" :value="i">{{ band }}</option>
				</select>
			</label>
			<template v-if="value.mode === 'single'">
				<label class="rs-row">
					<span>Colors</span>
					<select :value="value.colormap" @change="update({ colormap: $event.target.value })">
						<option v-for="name in colormaps" :key="name" :value="name">{{ name }}</option>
					</select>
					<label class="rs-reverse" title="Reverse colors"><input type="checkbox" :checked="value.reverse" @change="update({ reverse: $event.target.checked })" /> <i class="fas fa-exchange-alt"></i></label>
				</label>
				<div class="rs-legend" :style="{ background: gradient }"></div>
				<div class="rs-range">
					<input type="number" step="any" :value="rangeOf(value.band)[0]" @change="setRange(value.band, 0, $event.target.value)" title="Minimum" />
					<input type="number" step="any" :value="rangeOf(value.band)[1]" @change="setRange(value.band, 1, $event.target.value)" title="Maximum" />
				</div>
			</template>
		</template>
		<button v-if="value.mode !== 'palette'" type="button" class="rs-auto" @click="$emit('auto')" title="Stretch to the 2nd - 98th percentile of the visible data"><i class="fas fa-magic"></i> Auto stretch</button>
	</div>
</template>

<script>
import { COLORMAPS, cssGradient } from '../../data/colormaps';

function round(v) {
	return typeof v === 'number' && Number.isFinite(v) ? parseFloat(v.toPrecision(6)) : '';
}

export default {
	name: 'RasterStyle',
	props: {
		value: {
			type: Object,
			required: true
		},
		bands: {
			type: Array,
			default: () => []
		},
		hasPalette: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			colormaps: COLORMAPS,
			channels: ['red', 'green', 'blue']
		};
	},
	computed: {
		gradient() {
			return cssGradient(this.value.colormap, this.value.reverse);
		}
	},
	methods: {
		rangeOf(i) {
			const r = this.value.ranges[i];
			return r ? r.map(round) : ['', ''];
		},
		update(changes) {
			this.$emit('input', Object.assign({}, this.value, changes));
		},
		setRgb(c, band) {
			const rgb = this.value.rgb.slice();
			rgb[c] = Number(band);
			this.update({ rgb });
		},
		setRange(band, which, value) {
			const v = parseFloat(value);
			if (!Number.isFinite(v)) {
				return;
			}
			const ranges = this.value.ranges.slice();
			const r = (ranges[band] || [0, 1]).slice();
			r[which] = v;
			ranges[band] = r;
			this.update({ ranges });
		}
	}
};
</script>

<style lang="scss" scoped>
.raster-style {
	display: flex;
	flex-direction: column;
	gap: 0.35em;
	min-width: 13em;

	.rs-row {
		display: flex;
		align-items: center;
		gap: 0.4em;

		> span:first-child {
			min-width: 3.5em;
		}

		select {
			flex: 1;
			min-width: 0;
		}
	}

	.rs-swatch {
		display: inline-block;
		min-width: 1.4em !important;
		text-align: center;
		color: white;
		font-weight: bold;
		border-radius: 3px;

		&.red { background: #c62828; }
		&.green { background: #2e7d32; }
		&.blue { background: #1565c0; }
	}

	.rs-legend {
		height: 0.8em;
		border-radius: 2px;
		border: 1px solid rgba(0, 0, 0, 0.2);
	}

	.rs-range {
		display: flex;
		gap: 0.4em;

		input {
			width: 50%;
			min-width: 0;
		}

		input:last-child {
			text-align: right;
		}
	}

	.rs-reverse {
		white-space: nowrap;
		cursor: pointer;
	}

	.rs-auto {
		align-self: flex-start;
	}
}
</style>
