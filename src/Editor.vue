<template>
	<div id="container">
		<div id="ide">
			<BackendPanel :openEO="openEO" />
			<SourceEnvironment :openEO="openEO" />
			<div class="tabs" id="userContent">
				<div class="tabsHeader">
					<button class="tabItem" name="jobsTab" @click="changeUserTab"><i class="fas fa-tasks"></i> Jobs</button>
					<button class="tabItem" name="servicesTab" @click="changeUserTab" v-show="this.openEO.Capabilities.createService()"><i class="fas fa-cloud"></i> Services</button>
					<button class="tabItem" name="processGraphsTab" @click="changeUserTab" v-show="this.openEO.Capabilities.userProcessGraphs()"><i class="fas fa-code-branch"></i> Process Graphs</button>
					<button class="tabItem" name="filesTab" @click="changeUserTab" v-show="this.openEO.Capabilities.userFiles()"><i class="fas fa-file"></i> Files</button>
					<button class="tabItem" name="accountTab" @click="changeUserTab"><i class="fas fa-user"></i> Account</button>
				</div>
				<div class="tabsBody">
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
			</div>
			<footer>
				<a href="http://www.openeo.org" target="_blank"><img src="./assets/logo.png" id="openeoLogo" /></a>
			</footer>
		</div>
		<div id="viewer">
			<div class="tabs">
				<div class="tabsHeader">
					<button class="tabItem tabActive" name="mapTab" @click="changeViewerTab"><i class="fas fa-map"></i> Map</button>
					<button class="tabItem" name="imageTab" @click="changeViewerTab"><i class="fas fa-image"></i> Images</button>
					<button class="tabItem" name="dataTab" @click="changeViewerTab"><i class="fas fa-database"></i> Data</button>
				</div>
				<div class="tabsBody">
					<div class="tabContent tabActive" id="mapTab">
						<MapViewer ref="mapViewer" />
					</div>
					<div class="tabContent" id="imageTab">
						<ImageViewer ref="imageViewer" />
					</div>
					<div class="tabContent" id="dataTab">
						<DataViewer ref="dataViewer" />
					</div>
				</div>
			</div>
		</div>
		<vue-snotify />
		<Modal />
	</div>
</template>

<script>
import EventBus from './eventbus.js';
import AccountPanel from './components/AccountPanel.vue';
import BackendPanel from './components/BackendPanel.vue';
import DataViewer from './components/DataViewer.vue';
import FilePanel from './components/FilePanel.vue';
import ImageViewer from './components/ImageViewer.vue';
import JobPanel from './components/JobPanel.vue';
import MapViewer from './components/MapViewer.vue';
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
OpenEO.SupportedOutputFormats = {};
OpenEO.SupportedServices = [];

export default {
	name: 'openeo-web-editor',
	components: {
		AccountPanel,
		BackendPanel,
		DataViewer,
		ImageViewer,
		FilePanel,
		JobPanel,
		MapViewer,
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

		EventBus.$on('showInViewer', this.showInViewer);
		EventBus.$on('showMapViewer', this.showMapViewer);
		EventBus.$on('showImageViewer', this.showImageViewer);
		EventBus.$on('showDataViewer', this.showDataViewer);
	},
	methods: {

		changeServer(url) {
			this.openEO.Capabilities = new Capabilities();
			this.openEO.SupportedOutputFormats = {};
			this.openEO.SupportedServices = [];

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
			this.resetActiveTab('userContent');
		},

		requestCapabilities() {
			this.openEO.API.getCapabilities().then(info => {
				this.openEO.Capabilities = info;
				this.requestSupportedOutputFormats();
				this.requestSupportedServices();
				this.requestAuth();
			});
		},

		requestSupportedOutputFormats() {
			if (this.openEO.Capabilities.outputFormatCapabilities()) {
				this.openEO.API.getOutputFormats().then(info => {
					this.openEO.SupportedOutputFormats = info;
				});
			}
		},

		requestSupportedServices() {
			if (this.openEO.Capabilities.serviceCapabilities()) {
				this.openEO.Services.getCapabilities().then(info => {
					this.openEO.SupportedServices = info;
				});
			}
		},

		requestAuth() {
			// ToDo: Request credentials from user and authenticate him
			var credentials = [];
			if (this.openEO.API.driver == 'openeo-r-backend') {
				credentials = ['test', 'test'];
			}
			if (credentials.length === 2) {
				this.openEO.Auth.login(credentials[0], credentials[1])
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

		resetActiveTab(container) {
			var tab = document.getElementById(container).getElementsByClassName("tabItem")[0];
			this.showTab(container, tab.name);
		},

		setTabActive(elem) {
			if (!elem.className || elem.className.indexOf(' tabActive') === -1) {
				elem.className += " tabActive";
			}
		},
	
		changeUserTab(evt) {
			this.changeTab('userContent', evt);
		},

		changeViewerTab(evt) {
			this.changeTab('viewer', evt);
		},

		changeTab(container, evt) {
			this.showTab(container, evt.currentTarget.name);
		},

		showTab(container, tabName) {
			var containerNode = document.getElementById(container);
			var x = containerNode.getElementsByClassName("tabContent");
			for (var i = 0; i < x.length; i++) {
				x[i].className = x[i].className.replace(" tabActive", "");
				if (x[i].id == tabName) {
					this.setTabActive(x[i]);
				}
			}
			var tablinks = containerNode.getElementsByClassName("tabItem");
			for (var i = 0; i < tablinks.length; i++) {
				tablinks[i].className = tablinks[i].className.replace(" tabActive", "");
				if (tablinks[i].name == tabName) {
					this.setTabActive(tablinks[i]);
				}
			}
		},

		showMapViewer() {
			this.showTab('viewer', 'mapTab');
		},

		showImageViewer() {
			this.showTab('viewer', 'imageTab');
		},

		showDataViewer() {
			this.showTab('viewer', 'dataTab');
		},

		showInViewer(blob, script = null, originalOutputFormat = null) {
			if (!(blob instanceof Blob)) {
				throw 'No blob specified.';
			}
			var mimeType = blob.type;
			// Try to detect invalid mime types
			if (!mimeType || mimeType.indexOf('/') === -1 || mimeType.indexOf('*') !== -1) {
				mimeType = this.getMimeTypeForOutputFormat(originalOutputFormat);
			}
			switch(mimeType.toLowerCase()) {
				case 'image/png':
				case 'image/jpg':
				case 'image/jpeg':
				case 'image/gif':
					if (script) {
						this.$refs.imageViewer.setScript(script);
					}
					this.$refs.imageViewer.showImageBlob(blob);
					break;
				case 'text/plain':
				case 'application/json':
					this.$refs.dataViewer.showBlob(blob);
					break;
				case 'image/tif':
				case 'image/tiff':
					// ToDo: This should only execute when it's a GTiff, but for POC let every tiff pass
//					if (originalOutputFormat.format.toLowerCase() == 'gtiff') {
						this.$refs.mapViewer.updateTiffLayerBlob(blob);
						break;
//					}
				default:
					this.$utils.error(this, "Sorry, the returned content type is not supported to view.");
			}
		},

		getMimeTypeForOutputFormat(originalOutputFormat) {
			if (!originalOutputFormat.format) {
				return null;
			}
			var type = originalOutputFormat.format.toLowerCase();
			switch(type) {
				case 'png':
				case 'jpeg':
				case 'jpg':
				case 'gif':
					return 'image/' + type;
				case 'tif':
				case 'tiff':
				case 'gtiff':
					return 'image/tiff';
				case 'json':
					return 'application/json';
				default:
					return null;
			}
		}

	}
}
</script>

<style>
html, body, #app, #container, #ide, #viewer {
	height: 100%;
}
body {
	margin: 0;
	overflow: hidden;
	font-family: sans-serif;
	font-size: 90%;
}
a {
	color: #2F649A;
	text-decoration: none;
	cursor: pointer;
}
a:hover {
	color: black;
}
button {
	margin: 1px;
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
#SourceEnvironment, #userContent, #viewer .tabs {
	border: solid 1px #676767;
    margin: 1%;
	background-color: #f7f7f7;
}
.tabContent {
	display: none;
	background-color: white;
	border-top: 1px solid #ddd;
	overflow: auto;
	padding-top: 1px;
}
#viewer .tabsHeader {
	height: calc(1em + 16px);
}
#viewer .tabs {
	height: 97%;
}
#viewer .tabsBody, #viewer .tabContent {
	height: calc(98% - 1em + 16px);
}
#userContent .tabContent {
	padding: 5px;
	min-height: 200px;
	max-height: 350px;
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
	padding: 5px 10px;
	border: 1px solid #ddd;
	border-bottom: 0;
	border-radius: 5px 5px 0 0;
	white-space: nowrap;
	color: #666;
}
.tabItem:focus {
	outline: none;
}
div.tabActive {
	display: block;
}
button.tabActive {
	background-color: white;
	color: black;
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
