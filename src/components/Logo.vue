<template>
	<div class="logo">
		<img v-if="$config.logo" :src="$config.logo" :alt="$config.serviceName" />
		<h2>{{ $config.appName }} <span class="version" @click="showWebEditorInfo">{{ version }}</span></h2>
	</div>
</template>

<script>
import EventBusMixin from './EventBusMixin.vue';
import Package from '../../package.json';

export default {
	name: 'Logo',
	mixins: [EventBusMixin],
	data() {
		return {
			version: Package.version
		}
	},
	methods: {
		showWebEditorInfo() {
			this.emit('showWebEditorInfo');
		}
	}
}
</script>

<style lang="scss" scoped>
@import '../../theme.scss';

.logo {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 10px;
	box-sizing: border-box;
	flex-wrap: wrap;

	img {
		display: inline-block;
		max-height: 100%;
		max-width: 100%;
	}
	h2 {
		display: inline-block;
		margin: 0.5rem 1rem;
		font-size: 40px;
		color: white;
		font-weight: normal;
		white-space: nowrap;
	}
	.version {
		position: relative;
		top: -26px;
		font-size: 11px;
		background-color: $mainColor;
		color: white;
		padding: 3px;
		border-radius: 5px;
		cursor: pointer;
		
		&:hover {
			background-color: white;
			color: $mainColor;
		}
	}
}
</style>