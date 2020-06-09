<template>
	<Modal ref="modal">
		<template #main>
			<div class="vue-component server-info">
				<Capabilities :capabilities="capabilities" :url="url" :serviceTypes="serviceTypes" :fileFormats="fileFormats" :udfRuntimes="udfRuntimes" />
			</div>
		</template>
	</Modal>
</template>

<script>
import Modal from './Modal.vue';
import Capabilities from '@openeo/vue-components/components/Capabilities.vue';
import Utils from '../../utils.js';

export default {
	name: 'ServerInfoModal',
	components: {
		Modal,
		Capabilities
	},
	computed: {
		...Utils.mapState(['connection', 'fileFormats', 'serviceTypes', 'udfRuntimes']),
		capabilities() {
			return this.connection.capabilities().toJSON();
		},
		url() {
			return this.connection.getBaseUrl();
		}
	},
	methods: {
		show() {
			this.$refs.modal.show(this.connection.capabilities().title() || 'Server information');
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