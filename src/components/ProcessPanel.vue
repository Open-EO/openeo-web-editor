<template>
	<div class="docgen">
		<!-- ToDo: Implement processReferenceBuilder -->
		<Process :processData="process" :version="version" :provideDownload="false"></Process>
	</div>
</template>

<script>
import Process from '@openeo/vue-components/components/Process.vue';

export default {
	name: 'ProcessPanel',
	components: {
		Process
	},
	props: {
		version: {
			type: String,
			default: null
		},
		process: Object
	}
}
</script>

<style>
.docgen h2 {
	display: none;
}
</style>