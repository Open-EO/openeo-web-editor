<template>
	<button :title="title" class="data-sync" @click="update">
		<i v-if="syncState === true" class="fas fa-check"></i>
		<i v-else-if="syncState === false" class="fas fa-times"></i>
		<i v-else class="fas fa-sync"></i>
	</button>
</template>

<script>
export default {
	name: "SyncButton",
	props: {
		name: {
			type: String,
			required: true
		},
		sync: {
			type: Function,
			required: true
		}
	},
	data() {
		return {
			syncState: null
		};
	},
	computed: {
		title() {
			return "Refresh list of " + this.name
		}
	},
	methods: {
		async update(event) {
			if (this.syncState !== null) {
				return;
			}
			this.syncState = await this.sync(event);
			setTimeout(() => this.syncState = null, 3000);
		}
	}
}
</script>

<style scoped lang="scss">
.fa-check {
	color: green;
}
.fa-times {
	color: maroon;
}
</style>