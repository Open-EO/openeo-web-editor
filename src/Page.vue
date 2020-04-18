<template>
	<div :class="{container: true, connectForm: !isDiscovered}">
		<ConnectForm v-if="!isDiscovered" :skipLogin="skipLogin" />
		<IDE v-else />
		<Modal ref="modal" maxWidth="60%" />
		<vue-snotify />
		<div ref="webEditorInfo" style="display: none;">
			<p class="aboutPage">{{ pkg.description }}</p>
			<p class="aboutPage">This software is published by the <strong>openEO Consortium</strong> under the <strong>Apache 2.0 license</strong>. Please find more information about the openEO project on our <a href="http://www.openeo.org" target="_blank">homepage</a> and visit the <a href="https://github.com/Open-EO/openeo-web-editor" target="_blank">GitHub repository</a> for information about the Web Editor. Feel encouraged to <strong>report bugs, feature requests and other issues in the <a href="https://github.com/Open-EO/openeo-web-editor/issues" target="_blank">GitHub issue tracker</a></strong>.</p>
			<h3 class="aboutPage">Supported API versions:</h3>
			<ul class="aboutPage">
				<li v-for="v in pkg.apiVersions" :key="v"><a :href="'https://open-eo.github.io/openeo-api/v/'+v+'/index.html'" target="_blank">{{ v }}</a></li>
			</ul>
		</div>
	</div>
</template>

<script>
import Package from '../package.json';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import Utils from './utils';
import ConnectForm from './components/ConnectForm.vue';
import Modal from './components/modals/Modal.vue';
import axios from 'axios';
import Vue from 'vue';

// Making axios available globally for the OpenEO JS client
window.axios = axios;

export default {
	name: 'openeo-web-editor',
	mixins: [EventBusMixin],
	components: {
		ConnectForm,
		IDE: () => import('./components/IDE.vue'),
		Modal
	},
	data() {
		return {
			pkg: Package,
			skipLogin: false,
			title: null
		};
	},
	created() {
		this.skipLogin = !!Utils.param('discover');
	},
	mounted() {
		this.listen('showMessageModal', this.showMessageModal);
		this.listen('showHtmlModal', this.showHtmlModal);
		this.listen('showListModal', this.showListModal);
		this.listen('showWebEditorInfo', this.showWebEditorInfo);
		this.listen('title', this.setTitle);
	},
	watch: {
		isDiscovered(newVal) {
			if (newVal) {
				this.skipLogin = false;
			}
		},
		title(newTitle) {
			document.title = newTitle;
		}
	},
	computed: {
		...Utils.mapGetters(['isDiscovered'])
	},
	methods: {
		setTitle(subtitle) {
			var title = "openEO Web Editor";
			if (subtitle) {
				title += ": " + subtitle;
			}
			this.title = title;
		},
		showMessageModal(title, message) {
			this.$refs.modal.showMessage(title, message);
		},
		showHtmlModal(title, html) {
			this.$refs.modal.showHtml(title, html);
		},
		showListModal(title, list, listActions) {
			this.$refs.modal.showList(title, list, listActions);
		},
		showWebEditorInfo() {
			this.showHtmlModal("openEO Web Editor " + Package.version, this.$refs.webEditorInfo);
		}
	}
}
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=Ubuntu&display=swap');

html, body, .container {
	height: 100%;
	overflow: hidden;
}
.container.connectForm {
	background-color: #1665B6;
	align-items: center;
	display: flex;
	overflow: auto;
}
body, input, textarea, button, select {
	font-family: 'Ubuntu', sans-serif;
}
body {
	margin: 0;
}
a {
	color: #1665B6;
	text-decoration: none;
	cursor: pointer;
}
a:hover {
	color: black;
}
ul, ol {
	margin-bottom: 0;
	margin-top: 0;
	padding-bottom: 0;
	padding-top: 0;
}
button {
	margin: 1px;
}

.sepr {
    margin-right: 0.5em;
}
.sepl {
    margin-left: 0.5em;
}

.logo img {
	height: 60px;
	vertical-align: middle;
}
.logo h2 {
	display: inline-block;
	margin: 0;
	margin-left: 15px;
	font-size: 40px;
	vertical-align: middle;
	color: #152558;
	font-weight: normal;
}
.logo .version {
	position: relative;
	top: -26px;
	font-size: 11px;
	background-color: #152558;
	color: white;
	padding: 3px;
	border-radius: 5px;
	cursor: pointer;
}
.logo .version:hover {
	background-color: #65421F;
}

.boolean .fa-check-circle {
	color: green;
}
.boolean .fa-times-circle {
	color: red;
}
.boolean .fa-question-circle {
	color: #555;
}

.status[data-value="submitted"] {
	color: black;
}
.status[data-value="running"] {
	color: darkorange;
}
.status[data-value="queued"] {
	color: darkblue;
}
.status[data-value="finished"] {
	color: darkgreen;
}
.status[data-value="canceled"] {
	color: darkgrey;
}
.status[data-value="error"] {
	color: red;
}

.vue-component h2 {
	font-size: 1.75em;
	padding: 0.25em 0 0.25em 0;
	margin: 0 0 0.75em 0;
	border-bottom: 1px solid #ccc;
}
.vue-component h3 {
	font-size: 1.4em;
	margin: 1.5em 0 0.75em 0;
	padding: 0.25em 0 0.25em 0;
	border-bottom: 1px dotted #ccc;
}
.vue-component h4 {
	font-size: 1.2em;
}
.vue-component .tabular {
	margin: 0.5em 0;
}
.vue-component .tabular .value ul {
	padding-left: 20px;
}

.container .snotifyToast__title {
	font-size: 1em;
	font-weight: bold;
}
.container .snotifyToast__body {
	font-size: 0.9em;
}

p.aboutPage {
	line-height: 1.33em;
	text-align: justify;
	margin-top: 0;
}
h3.aboutPage {
	margin-bottom: 0.5em;
}

.noDataMessage {
	text-align: center;
	margin: 1em;
	font-weight: bold;
}
</style>