<template>
	<div id="container">
		<div id="ide">
			<BackendPanel :serverUrl="serverUrl" />
			<SourceEnvironment />
			<div class="userTabs">
				<div class="tabsHeader">
					<button class="tabItem tabActive" name="jobsTab" @click="changeTab">Jobs</button>
					<button class="tabItem" name="servicesTab" @click="changeTab">Services</button>
					<button class="tabItem" name="processGraphsTab" @click="changeTab">Process Graphs</button>
					<button class="tabItem" name="filesTab" @click="changeTab">Files</button>
					<button class="tabItem" name="accountTab" @click="changeTab">Account</button>
				</div>
				<div class="tabContent" id="jobsTab">
					<JobPanel />
				</div>
				<div class="tabContent" id="servicesTab">
					<ServicePanel />
				</div>
				<div class="tabContent" id="processGraphsTab">
					<ProcessGraphPanel />
				</div>
				<div class="tabContent" id="filesTab">
					<FilePanel />
				</div>
				<div class="tabContent tabActive" id="accountTab">
					<AccountPanel />
				</div>
			</div>
			<footer>
				<a href="http://www.openeo.org" target="_blank"><img src="./assets/logo.png" id="openeoLogo" /></a>
			</footer>
		</div>
		<div id="map">
			<Map />
		</div>
	</div>
</template>

<script>
import EventBus from './eventbus.js';
import AccountPanel from './components/AccountPanel.vue'
import BackendPanel from './components/BackendPanel.vue'
import FilePanel from './components/FilePanel.vue'
import JobPanel from './components/JobPanel.vue'
import Map from './components/Map.vue'
import ProcessGraphPanel from './components/ProcessGraphPanel.vue'
import ServicePanel from './components/ServicePanel.vue'
import SourceEnvironment from './components/SourceEnvironment.vue'

export default {
	name: 'openeo-web-editor',
	components: {
		AccountPanel,
		BackendPanel,
		FilePanel,
		JobPanel,
		Map,
		ProcessGraphPanel,
		ServicePanel,
		SourceEnvironment
	},
	data() {
		return {}
	},
	computed: {
		serverUrl: {
			get: function () {
				return this.$OpenEO.API.baseUrl;
			},
			set: function(value) {
				this.$OpenEO.API.baseUrl = value;
			}
		}
	},
	created() {
		this.setServerUrl(this.$config.serverUrl);
		EventBus.$on('changeServerUrl', this.setServerUrl);
	},
	mounted() {

	},
	methods: {

		setServerUrl(url) {
			this.$OpenEO.API.driver = 'openeo-sentinelhub-driver'; // ToDo: Remove this after proof-of-concept
			this.serverUrl = url;
		},
	
		changeTab: function(evt) {
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
html, body, #app, #container, #ide, #map {
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
#map {
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
.toolbar {
	border: solid 1px #676767;
	background-color: #f7f7f7;
    margin: 1%;
	padding: 5px;
	vertical-align: middle;
}
.data-toolbar, .processes-toolbar, .server-toolbar, .vis-toolbar, .auth-toolbar {
	display: inline-block;
	margin-right: 3%;
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
div.tabActive {
	display: block;
}
button.tabActive {
	font-weight: bold;
	background-color: white;
}
h3 {
	margin: 0;
	padding: 0;
}
.running, .active {
	color: green;
}
footer {
	text-align: center;
}
#openeoLogo {
	height: 60px;
}
</style>
