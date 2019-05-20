<template>
	<div id="container">
		<ConnectForm v-if="!isConnected" />
		<IDE v-else />
		<Modal ref="modal" />
		<vue-snotify />
	</div>
</template>

<script>
import EventBus from './eventbus.js';
import Utils from './utils';
import ConnectForm from './components/ConnectForm.vue';
import IDE from './components/IDE.vue';
import Modal from './components/Modal.vue';
import axios from 'axios';
import Vue from 'vue';

// Making axios available globally for the OpenEO JS client
window.axios = axios;

export default {
	name: 'openeo-web-editor',
	components: {
		ConnectForm,
		IDE,
		Modal
	},
	mounted() {
		EventBus.$on('showMessageModal', this.showMessageModal);
		EventBus.$on('showHtmlModal', this.showHtmlModal);
		EventBus.$on('showListModal', this.showListModal);
	},
	computed: {
		...Utils.mapGetters('server', ['isConnected'])
	},
	methods: {
		showMessageModal(title, message) {
			this.$refs.modal.showMessage(title, message);
		},
		showHtmlModal(title, html) {
			this.$refs.modal.showHtml(title, html);
		},
		showListModal(title, list, listActions) {
			this.$refs.modal.showList(title, list, listActions);
		}
	}
}
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=Ubuntu');

html, body, #container {
	height: 100%;
	overflow: hidden;
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

.boolean .fa-check-circle {
	color: green;
}
.boolean .fa-times-circle {
	color: red;
}
.boolean .fa-question-circle {
	color: #555;
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
.vue-component .tabular {
	margin: 0.5em 0;
}
.vue-component .tabular .value ul {
	padding-left: 20px;
}

#container .snotifyToast__title {
	font-size: 1.2em;
}
</style>