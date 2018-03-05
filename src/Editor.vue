<template>
	<div id="container">
		<div id="ide">
			<BackendPanel :openEO="openEO" />
			<SourceEnvironment :openEO="openEO" />
			<div class="userTabs">
				<div class="tabsHeader">
					<button class="tabItem" name="jobsTab" @click="changeTab"><i class="fas fa-tasks"></i> Jobs</button>
					<button class="tabItem" name="servicesTab" @click="changeTab" v-show="this.openEO.Capabilities.createService()"><i class="fas fa-map"></i> Services</button>
					<button class="tabItem" name="processGraphsTab" @click="changeTab" v-show="this.openEO.Capabilities.userProcessGraphs()"><i class="fas fa-code-branch"></i> Process Graphs</button>
					<button class="tabItem" name="filesTab" @click="changeTab" v-show="this.openEO.Capabilities.userFiles()"><i class="fas fa-file"></i> Files</button>
					<button class="tabItem" name="accountTab" @click="changeTab"><i class="fas fa-user"></i> Account</button>
				</div>
				<div class="tabContent" id="jobsTab">
					<JobPanel :userId="openEO.Auth.userId" :openEO="openEO" />
				</div>
				<div class="tabContent" id="servicesTab" v-show="this.openEO.Capabilities.createService()">
					<ServicePanel ref="servicePanel" :userId="openEO.Auth.userId" :openEO="openEO" />
				</div>
				<div class="tabContent" id="processGraphsTab" v-show="this.openEO.Capabilities.userProcessGraphs()">
					<ProcessGraphPanel :userId="openEO.Auth.userId" :openEO="openEO" />
				</div>
				<div class="tabContent" id="filesTab" v-show="this.openEO.Capabilities.userFiles()">
					<FilePanel :userId="openEO.Auth.userId" :openEO="openEO" />
				</div>
				<div class="tabContent" id="accountTab">
					<AccountPanel :userId="openEO.Auth.userId" :openEO="openEO" />
				</div>
			</div>
			<footer>
				<a href="http://www.openeo.org" target="_blank"><img src="./assets/logo.png" id="openeoLogo" /></a>
			</footer>
		</div>
		<div id="viewer">
			<Map v-if="openEO.Capabilities.createService()" />
		</div>
		<vue-snotify></vue-snotify>
		<Modal></Modal>
	</div>
</template>

<script>
import EventBus from './eventbus.js';
import AccountPanel from './components/AccountPanel.vue';
import BackendPanel from './components/BackendPanel.vue';
import FilePanel from './components/FilePanel.vue';
import JobPanel from './components/JobPanel.vue';
import Map from './components/Map.vue';
import Modal from './components/Modal.vue';
import ProcessGraphPanel from './components/ProcessGraphPanel.vue';
import ServicePanel from './components/ServicePanel.vue';
import SourceEnvironment from './components/SourceEnvironment.vue';
import axios from 'axios';
import { OpenEO, Capabilities } from 'openeo-js-client/openeo.js';
import OpenEOVisualizations from './visualizations.js';

// Making axios available globally for the OpenEO JS client
window.axios = axios;

OpenEO.Visualizations = OpenEOVisualizations;
OpenEO.Capabilities = new Capabilities();

export default {
	name: 'openeo-web-editor',
	components: {
		AccountPanel,
		BackendPanel,
		FilePanel,
		JobPanel,
		Map,
		Modal,
		ProcessGraphPanel,
		ServicePanel,
		SourceEnvironment
	},
	data() {
		return {
			openEO: OpenEO
		};
	},
	created() {
		EventBus.$on('changeServerUrl', this.changeServer);
		EventBus.$on('serverChanged', this.serverChanged);
	},
	mounted() {
		EventBus.$emit('changeServerUrl', this.$config.serverUrl);
	},
	methods: {

		changeServer(url) {
			this.openEO.Capabilities = new Capabilities();

			// Update server url
			this.openEO.API.baseUrl = url;
			// Invalidate old user id
			this.openEO.Auth.userId = null;
			// ToDo: Remove the driver switch after proof-of-concept
			if (url.indexOf('/api') !== -1) {
				this.openEO.API.driver = 'openeo-r-backend';
			}
			else {
				this.openEO.API.driver = 'other';
			}
			// Request authentication
			// ToDo: Problem: Auth is fired to late, BackendPanel updates earlier...
			this.requestCapabilities();
		},

		serverChanged() {
			this.resetActiveTab();
		},

		requestCapabilities() {
			this.openEO.API.getCapabilities().then(info => {
				this.openEO.Capabilities = info;
				this.requestAuth();
			});
		},

		requestAuth() {
			// ToDo: Request credentials from user and authenticate him
			if (this.openEO.API.driver == 'openeo-r-backend') {
				this.openEO.Auth.login('test', 'test')
					.then(data => {
						this.openEO.Auth.userId = data.user_id;
						EventBus.$emit('serverChanged');
					})
					.catch(errorCode => {
						EventBus.$emit('serverChanged');
					});
			}
			else {
				// ToDO: We assume we are authenticated, but this should be removed after POC.
				this.openEO.Auth.userId = 'me';
				EventBus.$emit('serverChanged');
			}
		},

		resetActiveTab() {
			var tab = document.getElementsByClassName("tabItem")[0];
			if (!tab.className || tab.className.indexOf(' tabActive') === -1) {
				tab.className += " tabActive";
			}
			document.getElementById(tab.name).style.display = "block";
		},
	
		changeTab(evt) {
			var i, x, tablinks;
			var tabName = evt.currentTarget.name;
			x = document.getElementsByClassName("tabContent");
			for (i = 0; i < x.length; i++) {
				x[i].style.display = "none";
			}
			tablinks = document.getElementsByClassName("tabItem");
			for (i = 0; i < x.length; i++) {
				tablinks[i].className = tablinks[i].className.replace(" tabActive", "");
			}
			document.getElementById(tabName).style.display = "block";
			evt.currentTarget.className += " tabActive";
		}
	}
}
</script>

<style>
html, body, #app, #container, #ide, #viewer {
	height:100%;
}
body {
	margin: 0;
	overflow: hidden;
	font-family: sans-serif;
	font-size: 90%;
}
ul, ol {
	margin-bottom: 0;
	margin-top: 0;
	padding-bottom: 0;
	padding-top: 0;
}
#viewer {
	position: absolute;
	top: 0px;
	left: 50%;
	width: 50%;
}
#ide {
	position: absolute;
	top: 0px;
	left: 0px;
	width: 50%;
	overflow-y: auto;
}
#SourceEnvironment, .userTabs {
	border: solid 1px #676767;
    margin: 1%;
	background-color: #f7f7f7;
}
.tabContent {
	display: none;
	padding: 5px;
	background-color: white;
	border-top: 1px solid #ddd;
	min-height: 200px;
	max-height: 350px;
	overflow: auto;
}
.tabContent table {
	width: 100%;
	border-collapse: collapse;
}
.tabContent table td, .tabContent table th {
	border: 1px solid #ddd;
	padding: 3px;
}
.tabItem {
	background-color: transparent;
	border: 0;
	margin: 5px 0 -1px 5px;
	padding: 5px;
	border: 1px solid #ddd;
	border-bottom: 0;
	border-radius: 5px 5px 0 0;
	width: 10%;
	min-width: 130px;
}
.tabItem:focus {
	outline: none;
}
button.tabActive {
	font-weight: bold;
	background-color: white;
}
h3 {
	margin: 0;
	padding: 0;
}
footer {
	text-align: center;
}
#openeoLogo {
	height: 60px;
}
</style>
