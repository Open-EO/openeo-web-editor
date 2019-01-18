<template>
	<div id="container">
		<div id="ide">
			<BackendPanel :connection="connection" />
			<div class="tabs" id="processGraphContent">
				<div class="tabsHeader">
					<button class="tabItem" name="graphTab" @click="changeProcessGraphTab"><i class="fas fa-code-branch"></i> Visual Model Builder</button>
					<button class="tabItem" name="sourceTab" @click="changeProcessGraphTab"><i class="fas fa-code"></i> Source Code</button>
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
		if (typeof this.$config.serverUrl === 'string' && this.$config.serverUrl.length > 0) {
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

/* block.js */

.blocks_js_editor * {
    padding:0;
    margin:0;
}

.blocks_js_editor {
    width:100%;
    height:100%;
    position:relative;
}

.blocks_js_editor .blocks {
    overflow:hidden;
}

.blocks_js_editor svg {
    position:absolute;
    z-index:1;
}

.blocks_js_editor .blocks {
    overflow:hidden;
    position:absolute;
    z-index:3;
    width:100%;
    height:100%;
}

/**
 * Menu bar
 */

.blocks_js_editor .menubar {
    width:100%;
    height:30px;
    z-index:1;
}

.blocks_js_editor .contextmenu,
.blocks_js_editor .childs {
    width:200px;
    padding:0px;
    position:absolute;
    display:none;
    float:left;
    z-index:99;
    box-shadow:0px 0px 5px #666;
    border:1px solid #aaa;
    background-color:#fff;
}

.blocks_js_editor .menubar .add span {
    color:green;
}

.blocks_js_editor .contextmenu .type,
.blocks_js_editor .contextmenu .menuentry,
.blocks_js_editor .contextmenu .family {
    font-size:14px;
    padding:1px;
    cursor:pointer;
    background-color:#fff;
    height:18px;
    color:#666;
    border-left:1px solid #aaa;
    border-right:1px solid #aaa;
    border-top:none;
    border-bottom:none;
    margin-left:-1px;
    margin-right:-1px;
    background-repeat:repeat-x;
    padding:3px;
}

.blocks_js_editor .contextmenu .menu_icon
{
    width:16px;
    height:16px;
    float:left;
    background-repeat:no-repeat;
    margin-right:3px;
}

.blocks_js_editor .contextmenu .menu_icon_compact
{
    background-image:url('http://gregwar.com/blocks.js/build/gfx/compact.png');
}

.blocks_js_editor .contextmenu .menu_icon_scale
{
    background-image:url('http://gregwar.com/blocks.js/build/gfx/scale.png');
}

.blocks_js_editor .contextmenu .menuentry:hover,
.blocks_js_editor .contextmenu .type:hover {
    background-color: #f7f7f7;
    color:black;
}

.blocks_js_editor .contextmenu .family {
	display: none;
}

/**
 * Blocks
 */

.blocks_js_editor .block {
    position:absolute;
    background-image:url('http://gregwar.com/blocks.js/build/gfx/blockFade.png');
    background-repeat:repeat-x;
    border:2px solid #fafafa;
    box-shadow:5px 5px 10px #aaa;
    padding:1px;
    margin-left:0px;
    margin-top:0px;
    background-color:#fafafa;
    opacity:0.8;
    font-size:14px;
    -moz-user-select:none;
    -khtml-user-select:none;
    -webkit-user-select:none;
    -o-user-select:none;
}

.blocks_js_editor .block .description {
    display:none;
    width:200px;
    padding:3px;
    border:1px solid #083776;
    border-radius:5px;
    color:#001531;
    background-color:#91bcf6;
    margin-top:15px;
    position:absolute;
    font-weight:normal;
}

.blocks_js_editor .blockTitle {
    font-weight:bold;
    background-color:#ddd;
    background-image:url('http://gregwar.com/blocks.js/build/gfx/titleFade.png');
    background-repeat:repeat-x;
    padding:1px;
    margin:-1px;
    margin-bottom:2px;
    cursor:move;
    font-size:80%;
}

.blocks_js_editor .blockTitle .blockId {
    opacity:0.4;
}

.blocks_js_editor .block .blockicon
{
    margin:0;
    padding:0;
    width:14px;
    height:14px;
    float:right;
    cursor:pointer;
    opacity:0.5;
    margin-right:2px;
}

.blocks_js_editor .block .blockicon:hover {
    opacity:1.0;
}

.blocks_js_editor .block .settings {
    background-image:url('http://gregwar.com/blocks.js/build/gfx/settings.png');
}

.blocks_js_editor .block .delete {
    background-image:url('http://gregwar.com/blocks.js/build/gfx/delete.png');
}

.blocks_js_editor .block .info {
    background-image:url('http://gregwar.com/blocks.js/build/gfx/info.png');
}

.blocks_js_editor .block_selected {
    border:2px solid #0a0;
}

.blocks_js_editor .block_selected .blockTitle {
    background-color:#0c0;
}

.blocks_js_editor .inputs,
.blocks_js_editor .outputs {
    width:80px;
}

.blocks_js_editor .outputs {
    float:right;
}

.blocks_js_editor .inputs {
    float:left;
}

.blocks_js_editor .inputs.loopable {
    float:right;
}

.blocks_js_editor .outputs.loopable {
    float:left;
}

.blocks_js_editor .connector {
    font-size:80%;
    padding-top:2px;
    background-repeat:no-repeat;
    cursor:pointer;
    clear:both;
    width:130px;
}

.blocks_js_editor .connector.disabled {
    opacity:0.4;
}

.blocks_js_editor .output {
    text-align:right;
}

.blocks_js_editor .circle {
    width:12px;
    height:12px;
    background-image:url('http://gregwar.com/blocks.js/build/gfx/circle.png');
    background-size:12px 12px;
}

.blocks_js_editor .circle.io_active {
    background-image:url('http://gregwar.com/blocks.js/build/gfx/circle_full.png');
}

.blocks_js_editor .circle.io_selected {
    background-image:url('http://gregwar.com/blocks.js/build/gfx/circle_selected.png') !important;
}

.blocks_js_editor input,
.blocks_js_editor textarea
{
    font-family:Courier;
}

.blocks_js_editor .input,
.blocks_js_editor .loopable .output
{
    float:left;
}

.blocks_js_editor .input .circle,
.blocks_js_editor .loopable .output .circle,
.blocks_js_editor .parameter .circle {
    float:left;
    margin:1px;
}

.blocks_js_editor .input .circle.io_active,
.blocks_js_editor .loopable .output .circle.io_active
{
    float:left;
    margin:1px;
}

.blocks_js_editor .output,
.blocks_js_editor .loopable .input {
    float:right;
}

.blocks_js_editor .output .circle,
.blocks_js_editor .loopable .input .circle
{
    float:right;
    margin:1px;
}

.blocks_js_editor .block .parameters {
    display:none;
    position:absolute;
    border:2px solid #aaa;
    padding:3px;
    z-index:50;
    width:250px;
    margin-left:-5px;
    margin-top:-5px;
    background-color:white;
}

/**
 * Messages
 */
.blocks_js_editor .messages {
    display:none;
    width:350px;
    position:absolute;
    z-index:100;
}

.blocks_js_editor .message {
    padding:5px;
    font-size:14px;
    cursor:pointer;
    border:3px solid;
    border-radius:5px;
}

.blocks_js_editor .messages ul {
    list-style:circle;
    margin-left:20px;
}

.blocks_js_editor .message.error {
    color:red;
    border-color:red;
    background-color:#ffe3e3;
}

.blocks_js_editor .message.valid {
    color:green;
    border-color:green;
    background-color:#eeffee;
}

.blocks_js_modal button {
    margin:5px;
    padding:2px;
    cursor:pointer;
    border:0;
    color:#222;
    font-size:18px;
}

.blocks_js_modal button.close {
    color:white;
    background-color:#ff4646;
}

.blocks_js_modal button.save {
    color:white;
    background-color:#21c40c;
    float:right;
}

.blocks_js_modal input, 
.blocks_js_modal select,
.blocks_js_modal textarea {
    width:250px;
    padding:2px;
    border:1px solid #aaa;
    border-radius:2px;
    background-color:#fafafa;
    margin:2px;
}

.blocks_js_modal textarea {
    width:400px;
    height:110px;
}

.blocks_js_modal .fieldsArray .pattern {
    display:none;
}
</style>
