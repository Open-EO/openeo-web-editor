<template>
	<Modal ref="modal">
		<template v-slot:main>
			<div class="vue-component server-info">
				<Capabilities :capabilities="capabilities" :url="url" />
				<template v-if="services">
					<h3>Supported secondary web service types</h3>
					<SupportedServiceTypes :version="capabilities.version" :services="services" />
				</template>
				<template v-if="formats">
					<h3>Supported output file formats</h3>
					<SupportedFileFormats :version="capabilities.version" :formats="formats" />
				</template>
			</div>
		</template>
	</Modal>
</template>

<script>
import Modal from './Modal.vue';
import Capabilities from '@openeo/vue-components/components/Capabilities.vue';
import SupportedFileFormats from '@openeo/vue-components/components/SupportedFileFormats.vue';
import SupportedServiceTypes from '@openeo/vue-components/components/SupportedServiceTypes.vue';

export default {
	name: 'ServerInfoModal',
	components: {
		Modal,
		Capabilities,
		SupportedFileFormats,
		SupportedServiceTypes
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
		show(connection, outputFormats, serviceTypes) {
			this.url = connection.getBaseUrl();
			this.capabilities = connection.capabilities().toPlainObject();
			this.formats = outputFormats;
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