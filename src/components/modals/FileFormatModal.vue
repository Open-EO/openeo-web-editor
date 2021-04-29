<template>
	<Modal ref="modal">
		<template #main>
			<FileFormat :id="id" :format="format" :type="type"></FileFormat>
		</template>
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
	data() {
		return {
			id: null,
			format: null,
			type: null
		};
	},
	methods: {
		show(id, format, type) {
			this.id = id;
			this.format = format;
			this.type = type;
			this.$refs.modal.show(format.title || id);
		}
	}
}
</script>

<style>
.file-format h2 {
	display: none;
}
</style>