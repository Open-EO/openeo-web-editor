<template>
	<div id="container">
		<div id="ide">
			<BackendPanel :connection="connection" :collections="collections" :processes="processes" />
			<div class="uiBox tabs" id="processGraphContent">
				<div class="tabsHeader">
					<button class="tabItem" name="graphTab" @click="changeProcessGraphTab"><i class="fas fa-code-branch"></i> Visual Model Builder</button>
					<button class="tabItem" name="sourceTab" @click="changeProcessGraphTab"><i class="fas fa-code"></i> Process Graph</button>
				</div>
				<div class="sourceHeader">
					<h3>
						<em v-if="scriptName === null ">Unnamed</em>
						<template v-else>{{ scriptName }}</template>
					</h3>
					<div class="sourceToolbar">
						<template v-if="isVisualBuilderActive">
							<button @click="blocksDelete()" v-show="blocksCanDelete()" title="Delete selected elements"><i class="fas fa-trash"></i></button>
							<button @click="blocksUndo()" v-show="blocksHasUndo()" title="Undo last change"><i class="fas fa-undo-alt"></i></button>
							<button @click="blocksToggleCompact()" :class="{compactActive: blocksCompactMode()}" title="Compact Mode"><i class="fas fa-compress-arrows-alt"></i></button>
							<button @click="blocksPerfectScale()" title="Scale to perfect size"><i class="fas fa-arrows-alt"></i></button>
						</template>
						<button @click="newScript" title="Clear current script / New script" class="sepl"><i class="fas fa-file"></i></button>
						<button @click="openScriptChooser" title="Load script from local storage"><i class="fas fa-folder-open"></i></button>
						<button @click="saveScript" title="Save script to local storage"><i class="fas fa-save"></i></button>
						<button @click="executeProcessGraph" title="Run current process graph and view results" class="sepl" v-if="this.supports('computeResult')"><i class="fas fa-play"></i></button>
					</div>
				</div>
				<div class="tabsBody">
					<div class="tabContent" id="graphTab">
						<GraphBuilderEnvironment ref="graphBuilder" :active="isVisualBuilderActive" :collections="collections" :processes="processes" fieldId="pgEditor" />
					</div>
					<div class="tabContent" id="sourceTab">
						<SourceEnvironment ref="sourceEditor" :active="!isVisualBuilderActive" />
					</div>
				</div>
			</div>
			<div class="uiBox tabs" id="userContent" v-show="this.connection">
				<div class="tabsHeader">
					<button class="tabItem" name="jobsTab" @click="changeUserTab" v-if="supportsJobs()"><i class="fas fa-tasks"></i> Batch Jobs</button>
					<button class="tabItem" name="servicesTab" @click="changeUserTab" v-if="supportsServices()"><i class="fas fa-cloud"></i> Web Services</button>
					<button class="tabItem" name="processGraphsTab" @click="changeUserTab" v-if="supportsProcessGraphs()"><i class="fas fa-code-branch"></i> Process Graphs</button>
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
			<div class="uiBox tabs">
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
			isVisualBuilderActive: true,
			savedScripts: {},
			scriptName: null,
			collections: [],
			processes: []
		};
	},
	created() {
		EventBus.$on('changeServerUrl', this.changeServer);
		EventBus.$on('serverChanged', this.serverChanged);
	},
	mounted() {
		this.resetActiveTab('userContent');
		this.resetActiveTab('processGraphContent');

		EventBus.$on('showEditor', this.showEditor);
		EventBus.$on('showInViewer', this.showInViewer);
		EventBus.$on('showMapViewer', this.showMapViewer);
		EventBus.$on('showImageViewer', this.showImageViewer);
		EventBus.$on('showDataViewer', this.showDataViewer);
		EventBus.$on('getProcessGraph', this.getProcessGraph);

		var storedScripts = localStorage.getItem("savedScripts");
		if (storedScripts !== null) {
			this.savedScripts = JSON.parse(storedScripts);
		}
	},
	computed: {
		savedScriptNames() {
			return Object.keys(this.savedScripts);
		}
	},
	watch: {
		savedScripts: {
			handler: function(newVal, oldVal) {
				localStorage.setItem("savedScripts", JSON.stringify(newVal));
			},
			deep: true
		}
	},
	methods: {

		// ToDO: Move this to the Blocks component, once we switched from jQuery to Vue
		blocksDelete() {
			if (this.$refs.graphBuilder) {
				this.$refs.graphBuilder.blocks.deleteEvent();
			}
		},
		blocksUndo() {
			if (this.$refs.graphBuilder) {
				this.$refs.graphBuilder.blocks.undo();
			}
		},
		blocksToggleCompact() {
			if (this.$refs.graphBuilder) {
				this.$refs.graphBuilder.blocks.toggleCompact();
			}
		},
		blocksPerfectScale() {
			if (this.$refs.graphBuilder) {
				this.$refs.graphBuilder.blocks.perfectScale();
				this.$refs.graphBuilder.$forceUpdate();
			}
		},
		blocksCanDelete() {
			if (this.$refs.graphBuilder) {
				return this.$refs.graphBuilder.blocks.canDelete();
			}
			return false;
		},
		blocksHasUndo() {
			if (this.$refs.graphBuilder) {
				return this.$refs.graphBuilder.blocks.hasUndo();
			}
			return false;
		},
		blocksCompactMode() {
			if (this.$refs.graphBuilder) {
				return this.$refs.graphBuilder.blocks.compactMode;
			}
			return false;
		},

		changeServer(url) {
			if (window.location.protocol === 'https:' && url.toLowerCase().substr(0,6) !== 'https:') {
				this.$utils.error(this, 'You are trying to connect to a back-end with HTTP instead of HTTPS, which is insecure and prohibited by web browsers. Please use HTTPS instead.');
				return;
			}
			try {
				OpenEO.connect(url)
					.then(connection => {
						this.connection = connection;
						this.requestSupportedOutputFormats();
						this.requestSupportedServices();
						this.requestAuth();
					}).catch(error => {
						this.$utils.exception(this, error);
					});
			} catch (e) {
				this.$utils.exception(this, error);
			}
		},

		serverChanged() {
			this.resetActiveTab('userContent');
			this.discoverData();
		},

		supports(feature) {
			return this.connection && this.connection.capabilities().hasFeature(feature);
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
				EventBus.$emit('serverChanged');
				this.$utils.info(this, 'Sorry, the authentication methods supported by the back-end is not supported by the Web Editor.');
			}
			else {
				EventBus.$emit('serverChanged');
				this.$utils.info(this, 'You are working without authorization. Your data will be publicly available!');
			}
		},

		discoverData() {
			if (this.supports('listCollections')) {
				this.connection.listCollections()
					.then(this.setDiscoveredCollections)
					.catch(error => this.setDiscoveredCollections([]));
			}
			if (this.supports('listProcesses') ) {
				this.connection.listProcesses()
					.then(this.setDiscoveredProcesses)
					.catch(error => this.setDiscoveredProcesses([]));
			}
		},
	
		setDiscoveredCollections(info) {
			var collections = [];
			for (var i in info.collections) {
				if (typeof info.collections[i].id === 'undefined') {
					continue;
				}
				collections.push(info.collections[i]);
			}
			collections.sort((a, b) => a.id.localeCompare(b.id));
			this.collections = collections;
		},
		
		setDiscoveredProcesses(info) {
			var processes = [];
			for (var i in info.processes) {
				if (typeof info.processes[i].id === 'undefined') {
					continue;
				}
				processes.push(info.processes[i]);
			}
			processes.sort((a, b) => a.id.localeCompare(b.id));
			this.processes = processes;
		},

		newScript() {
			var confirmed = confirm("Do you really want to clear the existing script to create a new one?");
			if (confirmed) {
				EventBus.$emit('clearProcessGraph');
				this.scriptName = null;
			}
		},

		loadScript(name) {
			var code = this.savedScripts[name];
			if (code) {
				EventBus.$emit('insertProcessGraph', code);
				this.scriptName = name;
				return true;  // to close the modal
			}
			else {
				this.$utils.info(this, 'No script with the name "' + name + '" found.');
				return false;  // to keep the modal open
			}
		},
		
		openScriptChooser() {
			EventBus.$emit('showComponentModal', 'Select script to load', 'List', {
				dataSource: () => this.savedScriptNames,
				actions: [
					{
						callback: this.loadScript,
						icon: 'check',
						title: 'Load script'
					},
					{
						callback: this.deleteScript,
						icon: 'trash',
						title: 'Delete script'
					}
				]
			});
		},

		saveScript() {
			var name = prompt("Name for the script:", this.scriptName);
			if (!name) {
				return;
			}
			EventBus.$emit('getProcessGraph', pg => {
				this.$set(this.savedScripts, name, pg);
				this.scriptName = name;
			});
		},

		deleteScript(name) {
			this.$delete(this.savedScripts, name);
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
			if (!this.connection) {
				return false;
			}
			return (this.connection.capabilities().hasFeature('listJobs') || this.connection.capabilities().hasFeature('createJob'));
		},

		supportsServices() {
			if (!this.connection) {
				return false;
			}
			return (this.connection.capabilities().hasFeature('listServices') || this.connection.capabilities().hasFeature('createService'));
		},

		supportsProcessGraphs() {
			if (!this.connection) {
				return false;
			}
			return (this.connection.capabilities().hasFeature('listProcessGraphs') || this.connection.capabilities().hasFeature('createProcessGraph'));
		},

		supportsFiles() {
			if (!this.connection) {
				return false;
			}
			return (this.connection.capabilities().hasFeature('listFiles') || this.connection.capabilities().hasFeature('uploadFile'));
		},
	
		changeUserTab(evt) {
			this.changeTab('userContent', evt);
		},
	
		changeProcessGraphTab(evt) {
			this.changeTab('processGraphContent', evt);
			this.enableVisualBuilder(this.isTabActive('graphTab'));
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
			if (this.$utils.isObject(elem) && typeof elem.className === 'string' && elem.className.indexOf(' tabActive') !== -1) {
				return true;
			}
			else {
				return false;
			}
		},

		showEditor() {
			this.showTab('processGraphContent', 'sourceTab');
			this.enableVisualBuilder(this.isTabActive('graphTab'));
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

		showInViewer(blob, originalOutputFormat = null) {
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

		enableVisualBuilder(enable) {
			if (this.isVisualBuilderActive === enable) {
				return; // Nothing changed
			}

			EventBus.$emit('getProcessGraph', pg => {
				this.isVisualBuilderActive = enable;
				this.$nextTick(() => EventBus.$emit('insertProcessGraph', pg));
			}, true, true);
		},

		getProcessGraph(callback, silent = false, passNull = false) {
			if (this.isVisualBuilderActive) {
				this.$refs.graphBuilder.getProcessGraph(callback, silent, passNull);
			}
			else {
				this.$refs.sourceEditor.getProcessGraph(callback, silent, passNull);
			}
		},

		executeProcessGraph() {
			this.$utils.info(this, 'Data requested. Please wait...');
			EventBus.$emit('getProcessGraph', script => {
				this.connection.execute(script)
					.then(data => EventBus.$emit('showInViewer', data))
					.catch(error => this.$utils.exception(this, error, 'Sorry, could not execute process graph.'));
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
#container {
	display: flex;
}
#ide {
	padding: 10px;
	width: 60%;
	min-width: 400px;
	overflow-y: auto;
}
#viewer {
	flex: 1;
	padding: 10px;
	max-width: 60%;
	min-width: 300px;
	border-left: 1px dotted #ccc;
}
.uiBox {
	border: 1px solid #676767;
	margin-bottom: 10px;
	background-color: #f7f7f7;
	border-radius: 3px;
}
.tabContent {
	display: none;
	background-color: white;
	border-top: 1px solid #ddd;
	overflow: auto;
	padding-top: 1px;
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
.tabsHeader {
	display: flex;
}
#processGraphContent .tabsHeader {
	display: flex;
}
.tabItem:first-of-type {
	margin-left: 5px;
}
.tabItem {
	background-color: transparent;
	border: 0;
	margin: 5px 5px -1px 0px;
	padding: 5px 10px;
	border: 1px solid #ddd;
	border-bottom: 0;
	border-radius: 5px 5px 0 0;
	white-space: nowrap;
	color: #666;
	min-width: 5em;
	text-overflow: ellipsis;
	overflow: hidden;
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

.sourceHeader {
	padding: 5px;
	border-top: 1px solid #ddd;
	display: flex;
	background-color: #fff;
}
.sourceHeader h3 {
	margin: 0;
	flex-grow: 1;
}
.sourceToolbar {
	text-align: right;
}
.sepr {
    margin-right: 0.5em;
}
.sepl {
    margin-left: 0.5em;
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
.dataPanel h3 {
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
.compactActive {
    color: green;
}
</style>