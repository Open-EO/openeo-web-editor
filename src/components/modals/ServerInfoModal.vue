<template>
	<Modal width="60%" :title="title" @closed="$emit('closed')">
		<div class="vue-component server-info">
			<Capabilities :capabilities="capabilities" :url="url" />

			<h3>File formats</h3>
			<FileFormats :formats="fileFormats" searchTerm="" :heading="null" :federation="federation" :missing="federationMissing.fileFormats"/>

			<h3>Secondary web services</h3>
			<ServiceTypes :services="serviceTypes" searchTerm="" :heading="null" :federation="federation" />

			<h3>Runtimes for user-defined functions (UDF)</h3>
			<UdfRuntimes :runtimes="udfRuntimes" searchTerm="" :heading="null" :federation="federation" />
		</div>
	</Modal>
</template>

<script>
import Modal from './Modal.vue';
import Capabilities from '@openeo/vue-components/components/Capabilities.vue';
import FileFormats from '@openeo/vue-components/components/FileFormats.vue';
import ServiceTypes from '@openeo/vue-components/components/ServiceTypes.vue';
import UdfRuntimes from '@openeo/vue-components/components/UdfRuntimes.vue';
import Utils from '../../utils.js';

export default {
	name: 'ServerInfoModal',
	components: {
		Modal,
		Capabilities,
		FileFormats,
		ServiceTypes,
		UdfRuntimes
	},
	computed: {
		...Utils.mapState(['connection', 'serviceTypes', 'udfRuntimes']),
		...Utils.mapState(['federation', 'federationMissing']),
		...Utils.mapGetters(['fileFormats']),
		capabilities() {
			return this.connection.capabilities().toJSON();
		},
		url() {
			return this.connection.getUrl();
		},
		title() {
			return this.connection.capabilities().title() || 'Server information';
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