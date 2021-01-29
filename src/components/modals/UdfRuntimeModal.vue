<template>
	<Modal ref="modal">
		<template #main>
			<UdfRuntime :id="id" :runtime="data" :version="version"></UdfRuntime>
		</template>
	</Modal>
</template>

<script>
import Modal from './Modal.vue';
import UdfRuntime from '@openeo/vue-components/components/UdfRuntime.vue';

export default {
	name: 'UdfRuntimeModal',
	components: {
		Modal,
		UdfRuntime
	},
	data() {
		return {
			id: null,
			data: null,
			version: null
		};
	},
	methods: {
		show(id, data, version = null) {
			this.id = id;
			this.data = data;
			this.version = version;
			this.$refs.modal.show(data.title || id);
		}
	}
}
</script>

<style>
.udf-runtime h2 {
	display: none;
}
</style>