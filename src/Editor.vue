<template>
	<div id="container">
		<div id="ide">
			<BackendPanel :connection="connection" />
			<div class="tabs" id="processGraphContent">
				<div class="tabsHeader">
					<button class="tabItem" name="graphTab" @click="changeProcessGraphTab"><i class="fas fa-code-branch"></i> Visual Model Builder</button>
					<button class="tabItem" name="sourceTab" @click="changeProcessGraphTab"><i class="fas fa-code"></i> Process Graph</button>
				</div>
				<div class="tabsActions">
					<button @click="executeProcessGraph" title="Run current process graph and view results" v-if="this.supports('startJob')"><i class="fas fa-play"></i></button>
				</div>
				<div class="tabsBody">
					<div class="tabContent" id="graphTab">
						<GraphBuilderEnvironment ref="graphBuilder" :active="isVisualBuilderActive" />
					</div>
					<div class="tabContent" id="sourceTab">
						<SourceEnvironment ref="sourceEditor" :active="!isVisualBuilderActive" />
					</div>
				</div>
			</div>
			<div class="tabs" id="userContent" v-show="this.connection">
				<div class="tabsHeader">
					<button class="tabItem" name="jobsTab" @click="changeUserTab" v-if="supportsJobs()"><i class="fas fa-tasks"></i> Batch Jobs</button>
					<button class="tabItem" name="servicesTab" @click="changeUserTab" v-if="supportsServices()"><i class="fas fa-cloud"></i> Web Services</button>
					<button class="tabItem" name="processGraphsTab" @click="changeUserTab" v-if="supportsProcessGraphs()"><i class="fas fa-code-branch"></i> Stored Process Graphs</button>
					<button class="tabItem" name="filesTab" @click="changeUserTab" v-if="supportsFiles()"><i class="fas fa-file"></i> Files</button>
					<button class="tabItem" name="accountTab" @click="changeUserTab"><i class="fas fa-user"></i> Account</button>
				</div>
				<div class="tabsBody">
					<div class="tabContent" id="jobsTab" v-if="supportsJobs()">
						<JobPanel :connection="connection" />
					</div>
					<div class="tabContent" id="servicesTab" v-if="supportsServices()">
						<ServicePanel :connection="connection" />
					</div>
					<div class="tabContent" id="processGraphsTab" v-if="supportsProcessGraphs()">
						<ProcessGraphPanel :connection="connection" />
					</div>
					<div class="tabContent" id="filesTab" v-if="supportsFiles()">
						<FilePanel :connection="connection" />
					</div>
					<div class="tabContent" id="accountTab">
						<AccountPanel :connection="connection" />
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
import GraphBuilderEnvironment from './components/GraphBuilderEnvironment.vue';
import ProcessGraphPanel from './components/ProcessGraphPanel.vue';
import ServicePanel from './components/ServicePanel.vue';
import SourceEnvironment from './components/SourceEnvironment.vue';
import axios from 'axios';
import { OpenEO } from '@openeo/js-client';
import Vue from 'vue';

// Making axios available globally for the OpenEO JS client
window.axios = axios;

export default {
	name: 'openeo-web-editor',
	components: {
		AccountPanel,
		BackendPanel,
		DataViewer,
		GraphBuilderEnvironment,
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
			connection: null,
			isVisualBuilderActive: true
		};
	},
	created() {
		EventBus.$on('changeServerUrl', this.changeServer);
		EventBus.$on('serverChanged', this.serverChanged);
	},
	mounted() {
		var serverFromQuery = this.$utils.param('server');
		if (this.$config.allowServerChange && this.$utils.isUrl(serverFromQuery)) {
			EventBus.$emit('changeServerUrl', serverFromQuery);
		}
		else if (this.$utils.isUrl(this.$config.serverUrl)) {
			EventBus.$emit('changeServerUrl', this.$config.serverUrl);
		}
		this.resetActiveTab('userContent');
		this.resetActiveTab('processGraphContent');

		EventBus.$on('showEditor', this.showEditor);
		EventBus.$on('showInViewer', this.showInViewer);
		EventBus.$on('showMapViewer', this.showMapViewer);
		EventBus.$on('showImageViewer', this.showImageViewer);
		EventBus.$on('showDataViewer', this.showDataViewer);
		EventBus.$on('getProcessGraph', this.getProcessGraph);
	},
	methods: {

		changeServer(url) {
			if (window.location.protocol === 'https:' && url.toLowerCase().substr(0,6) !== 'https:') {
				this.$utils.error(this, 'You are trying to connect to a back-end with HTTP instead of HTTPS, which is insecure and prohibited by web browsers. Please use HTTPS instead.');
				return;
			}
			try {
				var openEO = new OpenEO();
				openEO.connect(url).then(connection => {
					this.connection = connection;
					this.requestCapabilities();
				});
			} catch (e) {
				this.$utils.error(this, e);
			}
		},

		serverChanged() {
			this.resetActiveTab('userContent');
		},

		supports(feature) {
			return this.connection && this.connection.capabilitiesObject && this.connection.capabilitiesObject.hasFeature(feature);
		},

		requestCapabilities() {
			this.connection.capabilities().then(response => {
				this.connection.capabilitiesObject = response;
				this.requestSupportedOutputFormats();
				this.requestSupportedServices();
				this.requestAuth();
			}).catch(error => {
				console.log(error);
				this.$utils.error(this, 'Sorry, server is not responding.');
			});
		},

		requestSupportedOutputFormats() {
			if (this.supports('listFileTypes')) {
				this.connection.listFileTypes().then(response => this.connection.supportedOutputFormats = response);
			}
		},

		requestSupportedServices() {
			if (this.supports('listServiceTypes')) {
				this.connection.listServiceTypes().then(response => this.connection.supportedServices = response);
			}
		},

		requestAuth() {
			// TODO-CF: authenticateOIDC is missing
			if (this.supports('authenticateBasic')) {
				var opts = {
					submitLoginCallback: (user, password) => {
						return this.connection.authenticateBasic(user, password)
							.then(data => {
								EventBus.$emit('serverChanged');
								this.$utils.ok(this, 'Login successful.');
								return data;
							})
							.catch(error => {
								this.$utils.error(this, 'Sorry, credentials are wrong.');
								throw error;
							});
					},
					cancelCallback: () => {
						EventBus.$emit('serverChanged');
					}
				};
				EventBus.$emit('showComponentModal', 'Enter your credentials', 'CredentialsForm', opts);
			}
			else if (this.supports('authenticateOIDC')) {
				this.$utils.info(this, 'Sorry, the authentication methods supported by the back-end is not supported by the Web Editor.');
			}
			else {
				this.$utils.info(this, 'You are working without authorization. Your data will be publicly available!');
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

		supportsJobs() {
			if (!this.connection || !this.connection.capabilitiesObject) {
				return false;
			}
			return (this.connection.capabilitiesObject.hasFeature('listJobs') || this.connection.capabilitiesObject.hasFeature('createJob'));
		},

		supportsServices() {
			if (!this.connection || !this.connection.capabilitiesObject) {
				return false;
			}
			return (this.connection.capabilitiesObject.hasFeature('listServices') || this.connection.capabilitiesObject.hasFeature('createService'));
		},

		supportsProcessGraphs() {
			if (!this.connection || !this.connection.capabilitiesObject) {
				return false;
			}
			return (this.connection.capabilitiesObject.hasFeature('listProcessGraphs') || this.connection.capabilitiesObject.hasFeature('createProcessGraph'));
		},

		supportsFiles() {
			if (!this.connection || !this.connection.capabilitiesObject) {
				return false;
			}
			return (this.connection.capabilitiesObject.hasFeature('listFiles') || this.connection.capabilitiesObject.hasFeature('uploadFile'));
		},
	
		changeUserTab(evt) {
			this.changeTab('userContent', evt);
		},
	
		changeProcessGraphTab(evt) {
			this.changeTab('processGraphContent', evt);
			this.isVisualBuilderActive = this.isTabActive('graphTab');
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

		isTabActive(tabName) {
			var elem = document.getElementById(tabName);
			if (typeof elem === 'object' && elem !== null && typeof elem.className === 'string' && elem.className.indexOf(' tabActive') !== -1) {
				return true;
			}
			else {
				return false;
			}
		},

		showEditor() {
			this.showTab('processGraphContent', 'sourceTab');
			this.isVisualBuilderActive = this.isTabActive('graphTab');
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
			if (originalOutputFormat !== null && (!mimeType || mimeType.indexOf('/') === -1 || mimeType.indexOf('*') !== -1)) {
				mimeType = this.getMimeTypeForOutputFormat(originalOutputFormat);
			}
			if (typeof mimeType === 'string') {
				mimeType = mimeType.toLowerCase();
			}
			switch(mimeType) {
				case 'image/png':
				case 'image/jpg':
				case 'image/jpeg':
				case 'image/gif':
					this.$refs.imageViewer.showImageBlob(blob);
					break;
				case 'application/json':
				case 'text/plain':
					this.$refs.dataViewer.showBlob(blob, mimeType);
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

		getProcessGraph(callback) {
			if (this.isVisualBuilderActive) {
				this.$refs.graphBuilder.getProcessGraph(callback);
			}
			else {
				this.$refs.sourceEditor.getProcessGraph(callback);
			}
		},

		executeProcessGraph() {
			var format = prompt('Please specify the file format:', '');
			if (format === null) {
				return;
			}
			this.$utils.info(this, 'Data requested. Please wait...');
			EventBus.$emit('getProcessGraph', (script) => {
				this.connection.execute(script, format)
					.then(data => EventBus.$emit('showInViewer', data, script, format))
					.catch(error => this.$utils.error(this, 'Sorry, could not execute script.'));
			});
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
#userContent, #viewer .tabs, #processGraphContent {
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
#processGraphContent .tabsHeader {
	float: left;
	width: 80%;
}
#processGraphContent .tabsActions {
	text-align: right;
	float: right;
	width: 10%;
	padding: 4px 5px 0px 0px;
}
#processGraphContent .tabsBody {
	clear: both;
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
#container .snotifyToast__title {
	font-size: 1.2em;
}
</style>