<template>
	<ShareInterface v-if="canCopy"
		id="share-copy" title="Copy" :description="description" :action="copy"
		actionDefaultIcon="fa-clipboard" actionSuccessIcon="fa-clipboard-check" @stateChanged="state => this.state = state">
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
		description() {
			if (this.state === 'error') {
				return 'Copying to clipboard failed';
			}
			else if (this.state === 'success') {
				return 'Copied to clipboard';
			}
			else {
				return 'Copy the public URL to your clipboard';
			}
		}
	},
	methods: {
		copy() {
			return this.$clipboard(this.url);
		}
	},
	mounted() {
		this.canCopy = navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
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