<template>
	<ShareInterface id="share-twitter" title="Twitter" description="Share your data as a tweet">
		<template #customize>
			<textarea v-model="text"></textarea><br />
			<button @click="tweet">Open Twitter</button>
		</template>
	</ShareInterface>
</template>

<script>
import ShareMixin from './ShareMixin';
import ShareInterface from './ShareInterface.vue';

export default {
	name: 'TwitterShare',
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
		tweet() {
            let text = encodeURIComponent(this.text);
            let url = `https://twitter.com/intent/tweet?text=${text}`;
			window.open(url, '_blank').focus();
		}
	}
}
</script>

<style lang="scss">
#share-twitter {
	&.shareable:not(.expanded) > .entry {
		color: #1DA1F2;
	}
	textarea {
		width: 100%;
		height: 5em;
		overflow: auto;
		box-sizing: border-box;
	}
}
</style>