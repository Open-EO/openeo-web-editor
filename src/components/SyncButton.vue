<template>
  <AsyncButton fa confirm consistent icon="fas fa-sync" :title="title" :fn="sync" />
</template>

<script>
import AsyncButton from '@openeo/vue-components/components/internal/AsyncButton.vue';

export default {
	name: "SyncButton",
  components: {
    AsyncButton
  },
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
	computed: {
		title() {
			return "Reload list of " + this.name;
		}
	},
};
</script>
