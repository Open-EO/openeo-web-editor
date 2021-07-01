<template>
	<div class="container">
		<transition name="connect-fade" mode="out-in">
			<ConnectForm key="1" v-if="!isDiscovered" :skipLogin="skipLogin" />
			<IDE key="2" v-else />
		</transition>
		<Modal ref="modal" maxWidth="60%" />
		<WebEditorModal ref="webEditorModal" />
		<vue-snotify />
	</div>
</template>

<script>
import EventBusMixin from './components/EventBusMixin.vue';
import Utils from './utils';
import ConnectForm from './components/ConnectForm.vue';
import Modal from './components/modals/Modal.vue';
import WebEditorModal from './components/modals/WebEditorModal.vue';
import axios from 'axios';

// Making axios available globally for the OpenEO JS client
window.axios = axios;

export default {
	name: 'openeo-web-editor',
	mixins: [EventBusMixin],
	components: {
		ConnectForm,
		IDE: () => import('./components/IDE.vue'),
		Modal,
		WebEditorModal
	},
	data() {
		return {
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
		showListModal(title, list, listActions) {
			this.$refs.modal.showList(title, list, listActions);
		},
		showWebEditorInfo() {
			this.$refs.webEditorModal.show(this.$refs.webEditorInfo);
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

body, input, textarea, button, select, datalist {
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

button, input[type="submit"], input[type="reset"] {
	margin: 1px;
    background-color: #eee;
}
input, textarea, select, datalist, button {
	border: 1px solid #aaa;
	border-radius: 2px;
	padding: 2px 6px;
}
input:hover, textarea:hover, select:hover, datalist:hover, button:hover {
	border-color: #000;
}
input:hover:disabled, textarea:hover:disabled, select:hover:disabled, datalist:hover:disabled, button:hover:disabled {
	border-color: #aaa;
}
button:focus, input:focus, textarea:focus, select:focus, datalist:focus, .multiselect:focus-within {
    outline: none;
    box-shadow: 0 0 3px rgba(22, 102, 182, 0.75);
}
.multiselect input:focus {
	box-shadow: 0 0 0;
}
button:disabled i {
	color: #aaa;
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

tt, code {
	color: maroon;
	display: inline-block;
	padding: 0 0.1em 0 0.3em;
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

.container {
	width: 100%;
	height: 100%;
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


.message {
	padding: 0.5em;
	margin-bottom: 1em;
	border-radius: 0.5em;
}
.warning {
	border: 1px solid #f9d67a;
	background-color: #fbeabc;
	color: #795600;
}
.error {
	border: 1px solid #f97a7a;
	background-color: #fbbcbc;
	color: #790000;
}
.help, .message {
	display: flex;
}
.help span, .message span {
	display: block;
	flex-grow: 1;
}
.help .fas, .message .fas {
	display: block;
	height: 100%;
	margin-right: 0.5em;
}
.help {
	margin: 0.75em 0.5em;
}
.help span {
	font-size: 0.9em;
}

/* Transition */
.connect-fade-enter-active, .connect-fade-leave-active {
  transition: opacity .3s ease;
}
.connect-fade-enter, .connect-fade-leave-to {
  opacity: 0;
}
</style>