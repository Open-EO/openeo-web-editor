<template>
	<ShareInterface id="share-bluesky" :icon="['fab', 'fa-bluesky']" title="Bluesky" description="Share your STAC metadata as a Bluesky post">
		<template #customize>
			<textarea v-model="text"></textarea><br />
			<button @click="action">Open Bluesky</button>
		</template>
	</ShareInterface>
</template>

<script>
import ShareMixin from './ShareMixin';
import ShareInterface from './ShareInterface.vue';

export default {
	name: 'BlueskyShare',
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
			let url = `https://bsky.app/intent/compose?text=${text}`;
			window.open(url, '_blank').focus();
		}
	}
}
</script>

<style lang="scss">
#share-bluesky {
	&.shareable:not(.expanded) > .entry {
		color: #1185fe;
	}
	textarea {
		width: 100%;
		height: 5em;
		overflow: auto;
		box-sizing: border-box;
	}
}
</style>