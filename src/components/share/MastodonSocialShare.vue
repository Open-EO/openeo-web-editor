<template>
	<ShareInterface id="share-mastodon" :icon="['fab', 'fa-mastodon']" title="Mastodon.social" description="Share your STAC metadata as a toot on Mastodon.social">
		<template #customize>
			<textarea v-model="text"></textarea><br />
			<button @click="action">Open Mastodon.social</button>
		</template>
	</ShareInterface>
</template>

<script>
import ShareMixin from './ShareMixin';
import ShareInterface from './ShareInterface.vue';

export default {
	name: 'MastodonSocialShare',
	components: {
		ShareInterface
	},
	data() {
		return {
			text: ""
		};
	},
	created() {
		this.text = `"${this.title}" is available at ${this.url}`;
	},
	mixins: [
		ShareMixin
	],
	methods: {
		action() {
			let text = encodeURIComponent(this.text);
			let url = `https://mastodon.social/share?text=${text}`;
			window.open(url, '_blank').focus();
		}
	}
}
</script>

<style lang="scss">
#share-mastodon {
	&.shareable:not(.expanded) > .entry {
		color: #6364FF;
	}
	textarea {
		width: 100%;
		height: 5em;
		overflow: auto;
		box-sizing: border-box;
	}
}
</style>