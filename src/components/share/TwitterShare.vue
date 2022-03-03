<template>
	<div class="twitter">
		<strong>Twitter</strong><br />
		<small>Share your data as a tweet</small>
	</div>
</template>

<script>
import ShareMixin from './ShareMixin';

export default {
	name: 'TwitterShare',
	mixins: [
		ShareMixin
	],
	methods: {
		download() {

		}
	}
}
</script>

<style lang="scss" scoped>
</style>