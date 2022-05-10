<template>
	<div v-show="channels.length > 0" class="ol-unselectable ol-control channels">
		<table>
			<thead>
				<tr>
					<th v-if="!isGray">Channel</th>
					<th v-if="!isGray">Band</th>
					<th>Min</th>
					<th>Max</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(channel, i) in channels" :key="i">
					<th v-if="!isGray">{{ labels[i] }}</th>
					<td v-if="!isGray">
						<select v-model.number="channel.id">
							<option v-for="band in bands" :key="band.id" :value="band.id">{{ band.name || band.id }}</option>
						</select>
					</td>
					<td><input type="number" v-model.number="channel.min" required /></td>
					<td><input type="number" v-model.number="channel.max" required /></td>
				</tr>
			</tbody>
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
		isGray() {
			return this.bands.length === 1;
		},
		labels() {
			return this.isGray ? ['Grayscale'] : ['Red', 'Green', 'Blue'];
		}
	},
	data() {
		return {
			channels: []
		}
	},
	watch: {
		bands: {
			immediate: true,
			handler() {
				this.channels = this.bands.slice(0,3).map(band => Object.assign({}, band));
				// If only two channels are available, add a third one so that we have enough for RGB
				// If we only have one channel it is grayscale
				if (this.channels.length === 2) {
					this.channels.push(Object.assign({}, this.channels[1]));
				}
			}
		},
		channels: {
			deep: true,
			handler() {
				if (this.channels.filter(c => this.isValid(c.min) && this.isValid(c.max)).length > 0) {
					this.$emit('update', 'channels', this.channels);
				}
			}
		}
	},
	methods: {
		isValid(value) {
			return (typeof value === 'number');
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