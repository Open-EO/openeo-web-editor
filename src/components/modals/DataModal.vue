<template>
	<Modal width="60%" :title="title" @closed="$emit('closed')">
		<ObjectTree :data="data" />
	</Modal>
</template>


<script>
import Modal from './Modal.vue';
import ObjectTree from '@openeo/vue-components/components/ObjectTree.vue';

export default {
	name: 'DataModal',
	components: {
		Modal,
		ObjectTree
	},
	props: {
		title: {
			type: String,
			default: "Details"
		},
		data: {
			default: null
		}
	}
}
</script>