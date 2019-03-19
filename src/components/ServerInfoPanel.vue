<template>
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

<script>
import Capabilities from '@openeo/vue-components/components/Capabilities.vue';
import SupportedFileFormats from '@openeo/vue-components/components/SupportedFileFormats.vue';
import SupportedServiceTypes from '@openeo/vue-components/components/SupportedServiceTypes.vue';

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
.billing-plans h4 {
	display: inline-block;
	font-size: 1.2em;
	border-bottom: 1px dotted #ccc;
}
</style>