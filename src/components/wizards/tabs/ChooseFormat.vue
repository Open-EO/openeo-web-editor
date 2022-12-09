<template>
	<div class="step choose-format">
		<p>Please select the file format you want to download data in.</p>
		<SelectBox type="output-format" :value="value" @input="setFormat" :optionFilter="filterFormats" />
		<p v-if="scale !== null">
			<input type="checkbox" id="scale" v-model="scaleBox" />&nbsp;
			<label for="scale">Scale the values from [-1, 1] to [0, 255] (often required for PNG, GIF or JPEG).</label>
		</p> 
	</div>
</template>

<script>
import SelectBox from '../../datatypes/SelectBox.vue';

export default {
	name: 'ChooseFormat',
	components: {
		SelectBox
	},
	props: {
		value: {
			type: String,
			default: null
		},
		scale: {
			type: Boolean,
			default: null
		},
		gisDataType: {
			type: String,
			default: null
		}
	},
	computed: {
		scaleBox: {
			get() {
				return this.scale;
			},
			set(value) {
				this.$emit('update:scale', value);
			}
		},
		filterFormats() {
			if (!this.gisDataType) {
				return null;
			}
			return format => !Array.isArray(format.gis_data_types) || format.gis_data_types.length === 0 || format.gis_data_types.includes(this.gisDataType);
		}
	},
	methods: {
		setFormat(format) {
			this.scaleBox = ['bmp', 'gif', 'jpeg', 'jpg', 'png', 'webp'].includes(format.toLowerCase());
			this.$emit('input', format);
		}
	}
}
</script>