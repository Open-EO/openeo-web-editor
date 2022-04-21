<template>
	<div class="ol-unselectable ol-control channels">
		<table>
			<tr>
				<th>Channel</th>
				<th>Band</th>
				<th>Min.</th>
				<th>Max.</th>
				<th>No data</th>
			</tr>
			<tr>
				<th>Red</th>
				<td>
					<select>
						<option v-for="(band, key) in bands" :key="band.name" :value="key">{{ band.name }}</option>
					</select>
				</td>
				<td><input type="number" v-model="red.min" /></td>
				<td><input type="number" v-model="red.max" /></td>
				<td><input type="text" v-model="red.nodata" /></td>
			</tr>
			<tr>
				<th>Green</th>
				<td>
					<select>
						<option v-for="(band, key) in bands" :key="band.name" :value="key">{{ band.name }}</option>
					</select>
				</td>
				<td><input type="number" v-model="green.min" /></td>
				<td><input type="number" v-model="green.max" /></td>
				<td><input type="text" v-model="green.nodata" /></td>
			</tr>
			<tr>
				<th>Blue</th>
				<td>
					<select>
						<option v-for="(band, key) in bands" :key="band.name" :value="key">{{ band.name }}</option>
					</select>
				</td>
				<td><input type="number" v-model="blue.min" /></td>
				<td><input type="number" v-model="blue.max" /></td>
				<td><input type="text" v-model="blue.nodata" /></td>
			</tr>
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
			text: Array,
			default: () => []
		},
		defaults: {
			text: Array,
			default: () => []
		}
	},
	data() {
		return {
			red: {
				min: 0,
				max: 255,
				nodata: null
			},
			green: {
				min: 0,
				max: 255,
				nodata: null
			},
			blue: {
				min: 0,
				max: 255,
				nodata: null
			}
		}
	},
	watch: {
		red() {
			this.$emit('update', 'red', this.red);
		},
		green() {
			this.$emit('update', 'green', this.green);
		},
		blue() {
			this.$emit('update', 'blue', this.blue);
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