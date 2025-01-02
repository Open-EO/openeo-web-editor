<template>
	<ShareInterface id="share-x" :icon="['fab', 'fa-x']" title="X (Twitter)" description="Share your STAC metadata as a tweet">
		<template #customize>
			<textarea v-model="text"></textarea><br />
			<button @click="action">Open X</button>
		</template>
	</ShareInterface>
</template>

<script>
import ShareMixin from './ShareMixin';
import ShareInterface from './ShareInterface.vue';

export default {
	name: 'XShare',
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
			let url = `https://x.com/intent/tweet?text=${text}`;
			window.open(url, '_blank').focus();
		}
	}
}
</script>

<style lang="scss">
#share-x {
	&.shareable:not(.expanded) > .entry {
		color: #000000;
	}
	textarea {
		width: 100%;
		height: 5em;
		overflow: auto;
		box-sizing: border-box;
	}
}
</style>