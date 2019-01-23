<template>
	<div class="server-info">
		<Capabilities :capabilities="capabilities" :url="url" />
		<h3>Supported secondary web service types</h3>
		<SupportedServiceTypes :version="capabilities.version" :services="services" />
		<h3>Supported output file formats</h3>
		<SupportedFileFormats :version="capabilities.version" :formats="formats" />
	</div>
</template>

<script>
import Capabilities from '@openeo/vue-components/src/components/Capabilities.vue';
import SupportedFileFormats from '@openeo/vue-components/src/components/SupportedFileFormats.vue';
import SupportedServiceTypes from '@openeo/vue-components/src/components/SupportedServiceTypes.vue';

export default {
	name: 'ServerInfoPanel',
	components: {
		Capabilities,
		SupportedFileFormats,
		SupportedServiceTypes
	},
	props: ['url', 'capabilities', 'formats', 'services']
}
</script>

<style>
</style>