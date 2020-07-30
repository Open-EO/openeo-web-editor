<template>
	<Modal ref="modal" maxWidth="60%">
		<template #main>
			<p class="aboutPage">{{ pkg.description }}</p>
			<p class="aboutPage">This software is published by the <strong>openEO Consortium</strong> under the <strong>Apache 2.0 license</strong>. Please find more information about the openEO project on our <a href="http://www.openeo.org" target="_blank">homepage</a> and visit the <a href="https://github.com/Open-EO/openeo-web-editor" target="_blank">GitHub repository</a> for information about the Web Editor. Feel encouraged to <strong>report bugs, feature requests and other issues in the <a href="https://github.com/Open-EO/openeo-web-editor/issues" target="_blank">GitHub issue tracker</a></strong>.</p>
			<h3 class="aboutPage">Supported API versions:</h3>
			<ul class="aboutPage">
				<li v-for="v in pkg.apiVersions" :key="v"><a :href="'https://api.openeo.org/'+v" target="_blank">{{ v }}</a></li>
			</ul>
		</template>
	</Modal>
</template>

<script>
import Package from '../../../package.json';
import Modal from './Modal.vue';

export default {
	name: 'WebEditorModal',
	components: {
		Modal
	},
	data() {
		return {
			pkg: Package
		};
	},
	methods: {
		show() {
			this.$refs.modal.show("openEO Web Editor " + this.pkg.version);
		}
	}
}
</script>