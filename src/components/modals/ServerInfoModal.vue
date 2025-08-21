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

			<template v-if="hasProcessingParameters">
				<h3>Processing parameters</h3>

				<Collapse v-if="processingParameters.create_job_parameters.length > 0" title="Batch Jobs" headingTag="h4">
					<ProcessingParameters
						:parameters="processingParameters.create_job_parameters" title=""
						:federation="federation" :missing="processingParameters['federation:missing']" />
				</Collapse>
				<Collapse v-if="processingParameters.create_service_parameters.length > 0" title="Secondary Web Services" headingTag="h4">
					<ProcessingParameters
						:parameters="processingParameters.create_service_parameters" title=""
						:federation="federation" :missing="processingParameters['federation:missing']" />
				</Collapse>
				<Collapse v-if="processingParameters.create_synchronous_parameters.length > 0" title="Synchronous Processing" headingTag="h4">
					<ProcessingParameters
						:parameters="processingParameters.create_synchronous_parameters" title=""
						:federation="federation" :missing="processingParameters['federation:missing']" />
				</Collapse>
			</template>
		</div>
	</Modal>
</template>

<script>
import Modal from './Modal.vue';
import Capabilities from '@openeo/vue-components/components/Capabilities.vue';
import Collapse from '@openeo/vue-components/components/internal/Collapse.vue';
import FileFormats from '@openeo/vue-components/components/FileFormats.vue';
import ServiceTypes from '@openeo/vue-components/components/ServiceTypes.vue';
import UdfRuntimes from '@openeo/vue-components/components/UdfRuntimes.vue';
import ProcessingParameters from '@openeo/vue-components/components/ProcessingParameters.vue';
import Utils from '../../utils.js';

export default {
	name: 'ServerInfoModal',
	components: {
		Collapse,
		Modal,
		Capabilities,
		FileFormats,
		ProcessingParameters,
		ServiceTypes,
		UdfRuntimes
	},
	computed: {
		...Utils.mapState(['connection', 'federationMissing', 'processingParameters', 'serviceTypes', 'udfRuntimes']),
		...Utils.mapGetters(['federation', 'fileFormats']),
		hasProcessingParameters() {
			return Object.values(this.processingParameters).some(p => p.length > 0);
		},
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