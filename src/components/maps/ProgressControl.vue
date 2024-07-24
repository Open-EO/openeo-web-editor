<template>
	<div v-show="show" class="ol-unselectable ol-progress-control">
		<div class="progress-bar">
			<div class="progress-bar-inner" :style="{width: percent}" />
		</div>
		<div class="progress-label">{{ label }}</div>
	</div>
</template>

<script>
import ControlMixin from './ControlMixin';

export default {
	name: 'ProgressControl',
	mixins: [
		ControlMixin
	],
	data() {
		return {
			loading: 0,
			loaded: 0
		};
	},
	computed: {
		show() {
			return (this.loading > 0 && this.loaded <= this.loading);
		},
		percent() {
			return (this.loaded / this.loading * 100).toFixed(1) + '%';
		},
		label() {
			return "Loading Tiles (" + this.percent + ")";
		}
	},
	methods: {
		addLoading() {
			this.loading++;
			this.update();
		},
		addLoaded() {
			this.loaded++;
			this.update();
		},
		update() {
			if (this.loading === this.loaded) {
				this.loading = 0;
				this.loaded = 0;
			}

			if (this.loading === this.loaded) {
				this.loading = 0;
				this.loaded = 0;
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.ol-progress-control {
	opacity: 1;
	transition: opacity 0.4s;
	bottom: calc(22px + 1em);
    left: 8px;
	position: absolute;
	background-color: rgba(0,60,136,.5);
	border-radius: 4px;
	padding: 2px;
	width: 150px;
	text-align: center;
}
.ol-progress-control .progress-label {
	font-size: 10px;
	color: #fff;
	margin-top: 2px;
}
.ol-progress-control .progress-bar {
	border-radius: 4px;
	border: 1px solid #fff;
	height: 10px;
}
.ol-progress-control .progress-bar-inner {
	background-color: #fff;
	height: 10px;
	width: 0;
}
</style>