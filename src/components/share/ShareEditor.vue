<template>
	<ShareInterface v-if="canCopy"
		id="share-editor-copy" icon="fa-columns" :title="name" :description="description" :action="copy"
		actionDefaultIcon="fa-clipboard" actionSuccessIcon="fa-clipboard-check" @stateChanged="updateState">
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
				return `Publish as an interactive app and copy the URL of the app to the clipboard — experimental`;
			}
		},
		name() {
			return this.$config.appName;
		},
		editorUrl() {
			const url = new URL(window.location.href);
			const query = new URLSearchParams(url.search);
			query.set('result', this.url); // Pass canonical link, implies discover = 1
			if (this.type === 'service') {
				query.set('app~service', this.context.type);
			}
			url.search = query;
			return url.toString();
		}
	},
	methods: {
		updateState(state) {
			this.state = state;
		},
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