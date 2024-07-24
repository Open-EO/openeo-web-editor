<template>
	<div v-show="channels.length > 0" class="channels">
		<table>
			<thead>
				<tr v-if="title">
					<th :colspan="cols">{{ title }}</th>
				</tr>
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
import ControlMixin from './ControlMixin';

export default {
	name: 'ChannelControl',
	mixins: [
		ControlMixin
	],
	props: {
		title: {
			type: String,
			default: ''
		},
		bands: {
			type: Array,
			default: () => []
		},
		defaultChannels: {
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
			channels: this.defaultChannels,
			isGray: this.defaultChannels.length === 1 || this.bands.length === 1
		}
	},
	mounted() {
		//this.emit();
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
			if (this.defaultChannels.length > 0) {
				this.channels = this.defaultChannels;
				if (this.defaultChannels.length === 1) {
					this.isGray = true;
				}
			}
			else {
				this.channels = this.bands
					.slice(0, this.isGray ? 1 : 3)
					.map(band => Object.assign({}, band));
			}
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

<style lang="scss" scoped>
.channels {
	input {
		max-width: 4em;
	}
	select {
		max-width: 10em;
	}
	table {
		th {
			font-weight: 600;
			font-family: monospace;
		}
		th, td {
			padding: 2px;
		}
	}
}
</style>