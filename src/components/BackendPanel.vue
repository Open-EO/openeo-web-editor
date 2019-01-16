<template>
	<div id="backendPanel">
		<div class="server-toolbar" v-show="$config.allowServerChange">
			<h3>Server:</h3>
			<input id="serverUrl" v-model.lazy.trim="serverUrl" list="serverUrls" />
			<button @click="showServerSelector" title="Select previously used server"><i class="fas fa-book"></i></button>
			<button @click="updateServerUrlFromInput" title="Change server"><i class="fas fa-check"></i></button>
		</div>
		<div class="info-toolbar">
			<button @click="getServerInfo" title="Get server information"><i class="fas fa-info"></i></button>
		</div>
		<div class="collections-toolbar" v-show="showCollectionSelector()">
			Collection: <select id="collection" ref="collection">
				<option v-for="d in collections" :key="d.name" :value="d.name" :title="d.description">{{ d.name }}</option>
			</select>
			<button id="insertCollection" @click="insertCollection" title="Insert into script"><i class="fas fa-plus"></i></button>
			<button @click="showCollectionInfo" title="Show details" v-show="capabilities && capabilities.hasFeature('describeCollection')"><i class="fas fa-info"></i></button>
		</div>
		<div class="processes-toolbar" v-show="showProcessSelector()">
			Processes: <select id="processes" ref="processes">
				<option v-for="p in processes" :key="p.name" :value="p.name" :title="p.description">{{ p.name }}</option>
			</select>
			<button id="insertProcesses" @click="insertProcess" title="Insert into script"><i class="fas fa-plus"></i></button>
			<button @click="showProcessInfo" title="Show details" v-show="capabilities && capabilities.hasFeature('listProcesses')"><i class="fas fa-info"></i></button>
		</div>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';

export default {
	name: 'BackendPanel',
	props: ['connection', 'capabilities', 'supportedOutputFormats', 'supportedServices'],
	data() {
		return {
			processes: [],
			collections: [],
			serverUrls: [],
			serverUrl: ''
		};
	},
	watch: {
		serverUrls: function(newVal, oldVal) {
			localStorage.setItem("serverUrls", JSON.stringify(newVal));
		}
	},
	created() {
		EventBus.$on('changeServerUrl', this.changeServer);
		EventBus.$on('serverChanged', this.discoverData);
	},
	mounted() {
		var storedServers = localStorage.getItem("serverUrls");
		if (storedServers !== null) {
			this.serverUrls = JSON.parse(storedServers);
		}
	},
	methods: {

		showCollectionSelector() {
			return this.capabilities && this.capabilities.hasFeature('listCollections') && this.collections.length > 0;
		},

		showProcessSelector() {
			return this.capabilities && this.capabilities.hasFeature('listProcesses') && this.processes.length > 0;
		},

		showServerSelector() {
			EventBus.$emit('showComponentModal', 'Select previously used server', 'List', {
				dataSource: this.serverUrls,
				actions: [
					{
						callback: (url) => this.updateServerUrlTo(url) || true,  // return true to close the modal
						icon: 'check',
						title: 'Select this server'
					},
					{
						callback: (url) => this.serverUrls.splice(this.serverUrls.indexOf(url), 1),
						icon: 'trash',
						title: 'Delete entry from history'
					}
				]
			});
		},

		changeServer(url) {
			this.serverUrl = url;
			if (this.serverUrls.indexOf(url) === -1) {
				this.serverUrls.push(url);
			}
		},

		discoverData() {
			if (this.capabilities && this.capabilities.hasFeature('listCollections')) {
				this.connection.listCollections()
					.then(this.setDiscoveredCollections)
					.catch(error => this.setDiscoveredCollections([]));
			}
			if (this.capabilities && this.capabilities.hasFeature('listProcesses') ) {
				this.connection.listProcesses()
					.then(this.setDiscoveredProcesses)
					.catch(error => this.setDiscoveredProcesses([]));
			}
		},

		updateServerUrlFromInput() {
			if (typeof this.serverUrl === 'string' && this.serverUrl.length > 0) {
				if (!this.connection || this.serverUrl != this.connection.getBaseUrl()) {
					EventBus.$emit('changeServerUrl', this.serverUrl);
				}
			}
			else {
				this.$utils.error(this, 'Please specify a valid server URL.');
			}
		},

		updateServerUrlTo(newUrl) {
			this.serverUrl = newUrl;
			this.updateServerUrlFromInput();
		},

		getServerInfo() {
			if (!this.connection) {
				this.$utils.info(this, 'Not connected yet.');
				return;
			}
			var info = {
				url: this.connection.getBaseUrl(),
				supportedEndpoints: this.capabilities.listFeatures(),
				supportedWebServices: this.supportedServices,
				supportedOutputFormats: this.supportedOutputFormats
			};
			EventBus.$emit('showModal', 'Server information', info);
		},

		showCollectionInfo() {
			const name = this.$refs.collection.value;
			this.connection.describeCollection(name)
				.then(info => {
					EventBus.$emit('showModal', 'Collection: ' + name, info);
				})
				.catch(error => this.$utils.error(this, 'Sorry, can\'t load collection details.'));
		},

		showProcessInfo() {
			const name = this.$refs.processes.value;
			const info = this.processes.find(p => p.name == name);
			EventBus.$emit('showModal', 'Process: ' + name, info);
		},

		insertCollection() {
			EventBus.$emit('addCollectionToEditor', this.$refs.collection.value);
		},

		insertProcess() {
			EventBus.$emit('addProcessToEditor', this.$refs.processes.value);
		},
	
		setDiscoveredCollections(info) {
			this.collections = [];
			for (var i in info.collections) {
				if (typeof info.collections[i].name === 'undefined') {
					continue;
				}
				this.collections.push(info.collections[i]);
			}
			EventBus.$emit('propagateCollections', this.collections);
		},
		
		setDiscoveredProcesses(info) {
			this.processes = [];
			for (var i in info.processes) {
				if (typeof info.processes[i].name === 'undefined') {
					continue;
				}
				this.processes.push(info.processes[i]);
			}
			EventBus.$emit('propagateProcesses', this.processes);
		}
	}
}
</script>

<style scoped>
h3 {
	margin-top: 1px;
	display: inline-block;
	padding-right: 5px;
}
#backendPanel {
	border: solid 1px #676767;
	background-color: #f7f7f7;
	margin: 1%;
	padding: 5px;
	vertical-align: middle;
}
#serverUrl {
	width: 60%;
}
.server-toolbar {
	margin-bottom: 5px;
	padding-bottom: 5px;
	border-bottom: 1px dotted #ddd;
}
.collections-toolbar, .processes-toolbar, .info-toolbar {
	display: inline-block;
	margin-right: 3%;
}
.vis-toolbar {
	display: inline-block;
}
</style>