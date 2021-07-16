<template>
	<div class="container" :class="{connecting: !isDiscovered}">
		<transition name="connect-fade" mode="out-in">
			<ConnectForm key="1" v-if="!isDiscovered" :skipLogin="skipLogin" />
			<IDE key="2" v-else />
		</transition>
		<template v-for="modal in modals">
			<component :is="modal.component" :key="modal.id" v-bind="modal.props" v-on="modal.events" @closed="hideModal(modal)" />
		</template>
		<vue-snotify />
		<span v-show="activeRequests > 0" id="activeRequests">
			<i class="fas fa-spinner fa-spin fa-2x"></i>
		</span>
	</div>
</template>

<script>
import EventBusMixin from './components/EventBusMixin.vue';
import Utils from './utils';
import ConnectForm from './components/ConnectForm.vue';
import axios from 'axios';
import { UserProcess } from '@openeo/js-client';
import { ProcessGraph } from '@openeo/js-processgraphs';

// Making axios available globally for the OpenEO JS client
window.axios = axios;

export default {
	name: 'openeo-web-editor',
	mixins: [EventBusMixin],
	components: {
		ConnectForm,
		IDE: () => import('./components/IDE.vue'),
		CollectionModal: () => import('./components/modals/CollectionModal.vue'),
		ExpressionModal: () => import('./components/modals/ExpressionModal.vue'),
		FileFormatModal: () => import('./components/modals/FileFormatModal.vue'),
		JobEstimateModal: () => import('./components/modals/JobEstimateModal.vue'),
		JobInfoModal: () => import('./components/modals/JobInfoModal.vue'),
		ListModal: () => import('./components/modals/ListModal.vue'),
		ParameterModal: () => import('./components/modals/ParameterModal.vue'),
		ProcessModal: () => import('./components/modals/ProcessModal.vue'),
		ProcessParameterModal: () => import('./components/modals/ProcessParameterModal.vue'),
		ServerInfoModal: () => import('./components/modals/ServerInfoModal.vue'),
		ServiceInfoModal: () => import('./components/modals/ServiceInfoModal.vue'),
		UdfRuntimeModal: () => import('./components/modals/UdfRuntimeModal.vue'),
		WebEditorModal: () => import('./components/modals/WebEditorModal.vue')
	},
	data() {
		return {
			modals: [],
			skipLogin: false,
			title: null
		};
	},
	created() {
		this.skipLogin = !!Utils.param('discover');

		// Count active requests
		axios.interceptors.request.use(config => {
			this.startActiveRequest();
			return config;
		});

		// Add a response interceptor
		axios.interceptors.response.use(response => {
			this.endActiveRequest();
			return response;
		}, error => {
			this.endActiveRequest();
			return Promise.reject(error);
		});
	},
	mounted() {
		this.listen('showModal', this.showModal);
		this.listen('showListModal', this.showListModal);
		this.listen('showCollection', this.showCollection);
		this.listen('showProcess', this.showProcess);
		this.listen('showProcessParameter', this.showProcessParameter);
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
		...Utils.mapState(['activeRequests']),
		...Utils.mapGetters(['isDiscovered']),
		...Utils.mapState('editor', ['hightestModalZIndex']),
		...Utils.mapGetters('userProcesses', {getProcessById: 'getAllById'})
	},
	methods: {
		...Utils.mapActions(['describeAccount', 'describeCollection']),
		...Utils.mapMutations(['startActiveRequest', 'endActiveRequest']),
		...Utils.mapActions('userProcesses', {readUserProcess: 'read'}),
		setTitle(subtitle) {
			var title = "openEO Web Editor";
			if (subtitle) {
				title += ": " + subtitle;
			}
			this.title = title;
		},
		showModal(component, props = {}, events = {}, id = null) {
			this.modals.push({
				component,
				props,
				events,
				id: id || "modal_" + Date.now()
			});
		},
		hideModal(modal) {
			let id = Utils.isObject(modal) ? modal.id : modal;
			let index = this.modals.findIndex(other => other.id === id);
			if (typeof index !== 'undefined') {
				this.modals.splice(index, 1);
			}
		},
		showListModal(title, list, listActions) {
			this.showModal('ListModal', {title, list, listActions});
		},
		showWebEditorInfo() {
			this.showModal('WebEditorModal');
		},
		async showCollection(id) {
			try {
				let collection = await this.describeCollection(id);
				this.showModal('CollectionModal', {collection});
			} catch (error) {
				console.log(error);
				Utils.error(this, "Sorry, can't load collection details for '" + id + "'.");
			}
		},
		async showProcess(process) {
			// Convert process id into process
			if (typeof process === 'string') {
				process = this.getProcessById(process);
			}

			if (!process.native) {
				try {
					let udp = await this.readUserProcess({data: process});
					process = udp.toJSON();
				} catch(error) {
					Utils.exception(this, error, "Load Process Error: " + process.id);
					return;
				}
			}

			if (process instanceof ProcessGraph || process instanceof UserProcess) {
				process = process.toJSON();
			}

			this.showModal('ProcessModal', {process});
		},
		showProcessParameter(parameter, udp = true) {
			this.showModal('ProcessParameterModal', {
				parameter,
				udp
			});
		}
	}
}
</script>

<style lang="scss">
@import 'https://fonts.googleapis.com/css?family=Ubuntu&display=swap';
@import '../theme.scss';

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
	color: $linkColor;
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

.boolean .fa-check-circle {
	color: green;
}
.boolean .fa-times-circle {
	color: red;
}
.boolean .fa-question-circle {
	color: #555;
}

tt, .vue-component.styled-description code {
	color: maroon;
	display: inline-block;
	padding: 0 0.1em 0 0.3em;
}

#activeRequests {
	display: inline-block;
	width: 2em;
	height: 2em;
	padding: 0.5em;
	position: absolute;
	left: 1rem;
	bottom: 1rem;
	background-color: rgba(255, 255, 255, 0.5);
	border-radius: 2em;
	z-index: 9999;
}
.connecting #activeRequests {
	color: white;
	background-color: rgba(0, 0, 0, 0.5);
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

.help, .message {
	display: flex;

	span {
		display: block;
		flex-grow: 1;
	}
	.fas {
		display: block;
		height: 100%;
		margin-right: 0.5em;
	}

	&.info {
		border: 1px solid #aaa;
		background-color: #eee;
		color: #555;
	}
	&.warning {
		border: 1px solid #f9d67a;
		background-color: #fbeabc;
		color: #795600;
	}
	&.error {
		border: 1px solid #f97a7a;
		background-color: #fbbcbc;
		color: #790000;
	}
}
.message {
	padding: 0.5em;
	margin-bottom: 1em;
	border-radius: 0.5em;
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