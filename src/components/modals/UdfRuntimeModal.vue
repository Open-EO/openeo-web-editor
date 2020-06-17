<template>
	<Modal ref="modal">
		<template #main>
			<UdfRuntime :runtimeId="runtimeId" :runtimeData="runtimeData" :runtimeVersion="runtimeVersion"></UdfRuntime>
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
			runtimeId: null,
			runtimeData: null,
			runtimeVersion: null
		};
	},
	methods: {
		show(runtimeId, runtimeData, runtimeVersion = null) {
			this.runtimeId = runtimeId;
			this.runtimeData = runtimeData;
			this.runtimeVersion = runtimeVersion;
			this.$refs.modal.show(runtimeData.title || runtimeId);
		}
	}
}
</script>

<style>
.udf-runtime h2 {
	display: none;
}
</style>