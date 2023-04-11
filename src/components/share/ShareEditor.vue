<template>
	<ShareInterface v-if="canCopy"
		id="share-editor-copy" icon="fa-columns" :title="name" :description="description" :action="copy"
		actionDefaultIcon="fa-clipboard" actionSuccessIcon="fa-clipboard-check" @stateChanged="state => this.state = state">
	</ShareInterface>
</template>

<script>
import ShareMixin from './ShareMixin';
import ShareInterface from './ShareInterface.vue';
import Utils from '../../utils';

export default {
	name: 'ShareEditor',
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
		...Utils.mapState('editor', ['viewerOptions']),
		description() {
			if (this.state === 'error') {
				return 'Copying to clipboard failed';
			}
			else if (this.state === 'success') {
				return 'Copied to clipboard';
			}
			else {
				return `Publish as an interactive app and copy the URL of the app to the clipboard`;
			}
		},
		name() {
			return this.$config.appName;
		},
		editorUrl() {
			let url = new URL(window.location.href);
			let query = new URLSearchParams(url.search);
			query.set('result', this.url); // Pass canonical link, implies discover = 1
			if (Array.isArray(this.viewerOptions.channels) && this.viewerOptions.channels.length > 0) {
				let channels = this.viewerOptions.channels.map(ch => `${ch.id}|${ch.name}|${ch.min}|${ch.max}`).join(',');
				query.set('app~channels', channels);
			}
			url.search = query;
			return url.toString();
		}
	},
	methods: {
		copy() {
			return this.$clipboard(this.editorUrl);
		}
	},
	mounted() {
		this.canCopy = navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
	}
}
</script>

<style lang="scss">
@import '../../../theme.scss';

#share-editor-copy {
	&.shareable > .entry {
		color: $mainColor;
	}
}
</style>