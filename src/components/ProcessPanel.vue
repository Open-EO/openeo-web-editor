<template>
	<div class="docgen">
		<Process :process="process" :baseConfig="{provideDownload: false}">
			<slot name="process-header"></slot>
		</Process>
	</div>
</template>

<script>
import Process from '@openeo/vue-components/src/components/Process.vue';

export default {
	name: 'ProcessPanel',
	components: {
		Process
	},
	props: ['process']
}
</script>

<style>
.docgen h2 {
	display: none;
}
.docgen article.process {
	margin: 0;
}
</style>