<template>
	<div class="docgen">
		<Process :process="normalizedProcess" :baseConfig="{provideDownload: false}">
			<slot name="process-header"></slot>
		</Process>
	</div>
</template>

<script>
import { Process, Utils as DocGenUtils } from '@openeo/processes-docgen';
import "@openeo/processes-docgen/dist/DocGen.css";

export default {
	name: 'ProcessPanel',
	components: {
		Process
	},
	props: ['process'],
	computed: {
		normalizedProcess() {
			return DocGenUtils.normalizeProcess(
				Object.assign({}, this.process) // Without cloning this.process gets destroyed for an unknown reason.
			);
		}
	}
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