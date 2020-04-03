<template>
	<Modal ref="modal">
		<template #main>
			<div class="vue-component server-info">
				<Capabilities :capabilities="capabilities" :url="url" :serviceTypes="services" :fileFormats="formats" />
			</div>
		</template>
	</Modal>
</template>

<script>
import Modal from './Modal.vue';
import Capabilities from '@openeo/vue-components/components/Capabilities.vue';

export default {
	name: 'ServerInfoModal',
	components: {
		Modal,
		Capabilities
	},
	data() {
		return {
			url: null,
			capabilities: null,
			formats: null,
			services: null
		};
	},
	methods: {
		show(connection, fileFormats, serviceTypes) {
			this.url = connection.getBaseUrl();
			this.capabilities = connection.capabilities().toJSON();
			this.formats = fileFormats.toJSON();
			this.services = serviceTypes;
			this.$refs.modal.show(connection.capabilities().title() || 'Server information');
		}
	}
}
</script>

<style>
.capabilities h2 {
	display: none;
}
.billing-plans h4 {
	display: inline-block;
	font-size: 1.2em;
	border-bottom: 1px dotted #ccc;
}
</style>