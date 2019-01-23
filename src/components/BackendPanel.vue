<template>
	<div id="backendPanel">
		<div class="server-toolbar" v-show="$config.allowServerChange">
			<h3>Server:</h3>
			<input id="serverUrl" v-model.lazy.trim="serverUrl" list="serverUrls" />
			<button @click="showServerSelector" title="Select previously used server"><i class="fas fa-book"></i></button>
			<button @click="updateServerUrlFromInput" title="Change server"><i class="fas fa-check"></i></button>
			<button @click="getServerInfo" title="Get server information"><i class="fas fa-info"></i></button>
		</div>
		<div class="collections-toolbar" v-show="showCollectionSelector()">
			Collections: <select id="collection" ref="collection">
				<option v-for="d in collections" :key="d.name" :value="d.name">{{ d.name }}</option>
			</select>
			<button id="insertCollection" @click="insertCollection" title="Insert into script"><i class="fas fa-plus"></i></button>
			<button @click="showSelectedCollectionInfo" title="Show details" v-show="supports('describeCollection')"><i class="fas fa-info"></i></button>
		</div>
		<div class="processes-toolbar" v-show="showProcessSelector()">
			Processes: <select id="processes" ref="processes">
				<option v-for="p in processes" :key="p.name" :value="p.name" :title="p.summary ? p.summary : ''">{{ p.name }}</option>
			</select>
			<button id="insertProcesses" @click="insertProcess" title="Insert into script"><i class="fas fa-plus"></i></button>
			<button @click="showSelectedProcessInfo" title="Show details" v-show="supports('listProcesses')"><i class="fas fa-info"></i></button>
		</div>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';
import ConnectionMixin from './ConnectionMixin.vue';

export default {
	name: 'BackendPanel',
	mixins: [ConnectionMixin],
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
		EventBus.$on('showCollectionInfo', this.showCollectionInfo);
		EventBus.$on('showProcessInfo', this.showProcessInfo);
	},
	mounted() {
		var storedServers = localStorage.getItem("serverUrls");
		if (storedServers !== null) {
			this.serverUrls = JSON.parse(storedServers);
		}
	},
	methods: {

		showCollectionSelector() {
			return this.supports('listCollections') && this.collections.length > 0;
		},

		showProcessSelector() {
			return this.supports('listProcesses') && this.processes.length > 0;
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
				capabilities: this.connection.capabilitiesObject._data,
				services: this.connection.supportedServices,
				formats: this.connection.supportedOutputFormats
			};
			EventBus.$emit('showComponentModal', 'Server information', 'ServerInfoPanel', info);
		},

		showSelectedCollectionInfo() {
			this.showCollectionInfo(this.$refs.collection.value);
		},

		showCollectionInfo(id) {
			this.connection.describeCollection(id)
				.then(info => {
					EventBus.$emit('showModal', id, info);
				})
				.catch(error => this.$utils.error(this, "Sorry, can't load collection details."));
		},

		showSelectedProcessInfo() {
			this.showProcessInfo(this.$refs.processes.value);
		},

		showProcessInfo(id) {
			const info = this.processes.find(p => p.name == id);
			EventBus.$emit('showComponentModal', id, 'ProcessPanel', {process: info});
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
.collections-toolbar, .processes-toolbar {
	display: inline-block;
	width: 50%;
}
.vis-toolbar {
	display: inline-block;
}
#collection, #process {
	max-width: 55%;
}
</style>