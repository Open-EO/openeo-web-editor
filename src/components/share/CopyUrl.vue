<template>
	<ShareInterface v-if="canCopy"
		id="share-copy" icon="fa-file-code" :title="name" :description="description" :action="copy"
		actionDefaultIcon="fa-clipboard" actionSuccessIcon="fa-clipboard-check" @stateChanged="updateState">
	</ShareInterface>
</template>

<script>
import ShareMixin from './ShareMixin';
import ShareInterface from './ShareInterface.vue';

export default {
	name: 'CopyUrl',
	components: {
		ShareInterface
	},
	mixins: [
		ShareMixin
	],
	data() {
		return {
			state: 'default',
			canCopy: false
		};
	},
	computed: {
		name() {
			return this.type === 'service' ? 'Web Service' : 'STAC metadata';
		},
		description() {
			if (this.state === 'error') {
				return 'Copying to clipboard failed';
			}
			else if (this.state === 'success') {
				return 'Copied to clipboard';
			}
			else {
				return `Copy the public URL of the ${this.name} to your clipboard`;
			}
		}
	},
	methods: {
		updateState(state) {
			this.state = state;
		},
		copy() {
			return this.$clipboard(this.url);
		}
	},
	mounted() {
		this.canCopy = navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function';

		let link = document.createElement('link');
		link.as = "font";
		link.type = "font/woff2";
		link.crossOrigin = "";
		link.href = "https://use.fontawesome.com/releases/v5.13.0/webfonts/fa-brands-400.woff2";
		let head = document.getElementsByTagName("head")[0];
		head.appendChild(link);
	}
}
</script>

<style lang="scss">
#share-copy {
	&.shareable > .entry {
		color: #856404;
	}
}
</style>