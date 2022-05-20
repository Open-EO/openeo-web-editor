<template>
	<div v-show="channels.length > 0" class="ol-unselectable ol-control channels">
		<table>
			<thead>
				<tr>
					<th v-if="!isGray">Channel</th>
					<th v-if="multiBand">Band</th>
					<th>Min</th>
					<th>Max</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(channel, i) in channels" :key="i">
					<th v-if="!isGray">{{ labels[i] }}</th>
					<td v-if="multiBand">
						<select v-model.number="channel.id">
							<option v-for="band in bands" :key="band.id" :value="band.id">{{ band.name || band.id }}</option>
						</select>
					</td>
					<td><input type="number" v-model.number="channel.min" required /></td>
					<td><input type="number" v-model.number="channel.max" required /></td>
				</tr>
			</tbody>
			<tfoot v-if="multiBand">
				<tr>
					<td :colspan="cols">
						<input type="checkbox" v-model="isGray" /> Grayscale
					</td>
				</tr>
			</tfoot>
		</table>
	</div>
</template>

<script>
import ControlMixin from './ControlMixin.vue';

export default {
	name: 'ChannelControl',
	mixins: [
		ControlMixin
	],
	props: {
		bands: {
			type: Array,
			default: () => []
		}
	},
	computed: {
		multiBand() {
			return this.bands.length > 1;
		},
		cols() {
			if (this.isGray) {
				return this.multiBand ? 3 : 2;
			}
			return 4;
		},
		labels() {
			return this.isGray ? ['Grayscale'] : ['Red', 'Green', 'Blue'];
		}
	},
	data() {
		return {
			channels: [],
			isGray: this.bands.length === 1
		}
	},
	watch: {
		bands: {
			immediate: true,
			handler() {
				if (this.bands.length === 1) {
					this.isGray = true;
				}
				this.updateChannels();
			}
		},
		isGray() {
			this.updateChannels();
			this.emit();
		},
		channels: {
			deep: true,
			handler() {
				this.emit();
			}
		}
	},
	methods: {
		isValid(value) {
			return (typeof value === 'number');
		},
		updateChannels() {
			this.channels = this.bands
				.slice(0, this.isGray ? 1 : 3)
				.map(band => Object.assign({}, band));
			// If only two channels are available, add a third one so that we have enough for RGB
			// If we only have one channel it is grayscale
			if (this.channels.length === 2) {
				this.channels.push(Object.assign({}, this.channels[1]));
			}
		},
		emit() {
			if (this.channels.filter(c => this.isValid(c.min) && this.isValid(c.max)).length > 0) {
				this.$emit('update', 'channels', this.channels);
			}
		}
	}
}
</script>

<style lang="scss">
.ol-control.channels {
	bottom: calc(22px + 1em);
    right: 8px;
	position: absolute;

	input {
		max-width: 4em;
	}
	select {
		max-width: 10em;
	}
}
</style>