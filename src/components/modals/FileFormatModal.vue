<template>
	<Modal ref="modal" :title="title" @closed="$emit('closed')">
		<FileFormat :id="id" :format="format" :type="type"></FileFormat>
	</Modal>
</template>

<script>
import Modal from './Modal.vue';
import FileFormat from '@openeo/vue-components/components/FileFormat.vue';

export default {
	name: 'FileFormatModal',
	components: {
		Modal,
		FileFormat
	},
	props: {
		id: {
			type: String
		},
		format: {
			type: Object
		},
		type: {
			type: String
		}
	},
	computed: {
		title() {
			return this.format.title || this.id;
		}
	}
}
</script>

<style scoped lang="scss">
.file-format h2 {
	display: none;
}
</style>