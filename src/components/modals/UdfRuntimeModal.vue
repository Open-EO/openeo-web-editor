<template>
	<Modal width="80%" :title="title" @closed="$emit('closed')">
		<UdfRuntime :id="id" :runtime="data" :version="version" :federation="federation"></UdfRuntime>
	</Modal>
</template>

<script>
import Utils from '../../utils.js';
import Modal from './Modal.vue';
import UdfRuntime from '@openeo/vue-components/components/UdfRuntime.vue';

export default {
	name: 'UdfRuntimeModal',
	components: {
		Modal,
		UdfRuntime
	},
	props: {
		id: {
			type: String
		},
		data: {
			type: Object
		},
		version: {
			type: String
		}
	},
	computed: {
		...Utils.mapGetters(['federation']),
		title() {
			return this.data.title || this.id;
		}
	}
}
</script>

<style>
.udf-runtime h2 {
	display: none;
}
</style>