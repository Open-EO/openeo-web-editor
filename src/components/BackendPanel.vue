<template>
	<div id="backendPanel" class="uiBox dataPanel">
		<div class="server-toolbar" v-show="allowServerChange">
			<h3>Server:</h3>
			<input id="serverUrl" v-model.lazy.trim="serverUrl" />
			<button @click="showServerSelector" title="Select previously used server"><i class="fas fa-book"></i></button>
			<button @click="updateServerUrlFromInput" title="Change server"><i class="fas fa-check"></i></button>
			<button @click="getServerInfo" title="Get server information"><i class="fas fa-info"></i></button>
		</div>
		<div class="discovery-toolbar" v-if="showCollectionSelector() && showProcessSelector()">
			<div class="collections-toolbar" v-if="showCollectionSelector()">
				<span>Collections:</span>
				<select id="collection" ref="collection">
					<option v-for="d in collections" :key="d.id" :value="d.id">{{ d.id }}</option>
				</select>
				<button id="insertCollection" @click="insertCollection" title="Insert into script"><i class="fas fa-plus"></i></button>
				<button @click="showSelectedCollectionInfo" title="Show details" v-show="supports('describeCollection')"><i class="fas fa-info"></i></button>
			</div>
			<div class="processes-toolbar" v-if="showProcessSelector()">
				<span>Processes:</span>
				<select id="processes" ref="processes">
					<option v-for="p in processes" :key="p.id" :value="p.id" :title="p.summary ? p.summary : ''">{{ p.id }}</option>
				</select>
				<button id="insertProcesses" @click="insertProcess" title="Insert into script"><i class="fas fa-plus"></i></button>
				<button @click="showSelectedProcessInfo" title="Show details" v-show="supports('listProcesses')"><i class="fas fa-info"></i></button>
			</div>
		</div>
	</div>
</template>

<script>
import Config from '../../config.js';
import EventBus from '../eventbus.js';
import ConnectionMixin from './ConnectionMixin.vue';
import Utils from '../utils.js';

export default {
	name: 'BackendPanel',
	mixins: [ConnectionMixin],
	computed: {
		...Utils.mapState('editor', ['storedServers']),
		...Utils.mapState('server', ['processes', 'collections'])
	},
	data() {
		return {
			serverUrl: Config.serverUrl,
			allowServerChange: Config.allowServerChange
		};
	},
	created() {
		EventBus.$on('changeServerUrl', this.changeServer);
		EventBus.$on('showCollectionInfo', this.showCollectionInfo);
		EventBus.$on('showProcessInfo', this.showProcessInfo);
	},
	mounted() {
		var serverFromQuery = Utils.param('server');
		if (this.allowServerChange && Utils.isUrl(serverFromQuery)) {
			EventBus.$emit('changeServerUrl', serverFromQuery);
		}
		else if (Utils.isUrl(this.serverUrl)) {
			EventBus.$emit('changeServerUrl', this.serverUrl);
		}
	},
	methods: {

		...Utils.mapMutations('editor', ['addServer', 'removeServer']),

		showCollectionSelector() {
			return this.supports('listCollections') && this.collections.length > 0;
		},

		showProcessSelector() {
			return this.supports('listProcesses') && this.processes.length > 0;
		},

		showServerSelector() {
			EventBus.$emit('showComponentModal', 'Select previously used server', 'List', {
				dataSource: this.storedServers,
				actions: [
					{
						callback: (url) => this.updateServerUrlTo(url) || true,  // return true to close the modal
						icon: 'check',
						title: 'Select this server'
					},
					{
						callback: (url) => this.removeServer(url),
						icon: 'trash',
						title: 'Delete entry from history'
					}
				]
			});
		},

		changeServer(url) {
			this.serverUrl = url;
			this.addServer(url);
		},

		updateServerUrlFromInput() {
			if (typeof this.serverUrl === 'string' && this.serverUrl.length > 0) {
				if (!this.connection || this.serverUrl != this.connection.getBaseUrl()) {
					EventBus.$emit('changeServerUrl', this.serverUrl);
				}
			}
			else {
				Utils.error(this, 'Please specify a valid server URL.');
			}
		},

		updateServerUrlTo(newUrl) {
			this.serverUrl = newUrl;
			this.updateServerUrlFromInput();
		},

		getServerInfo() {
			if (!this.connection) {
				Utils.info(this, 'Not connected yet.');
				return;
			}
			var info = {
				url: this.connection.getBaseUrl(),
				capabilities: this.connection.capabilities().toPlainObject(),
				services: this.connection.supportedServices,
				formats: this.connection.supportedOutputFormats
			};
			EventBus.$emit('showComponentModal', this.connection.capabilities().title() || 'Server information', 'ServerInfoPanel', info);
		},

		showSelectedCollectionInfo() {
			this.showCollectionInfo(this.$refs.collection.value);
		},

		showCollectionInfo(id) {
			this.connection.describeCollection(id)
				.then(info => {
					EventBus.$emit('showComponentModal', id, 'CollectionPanel', {
						collection: info,
						version: this.connection.capabilities().apiVersion()
					});
				})
				.catch(error => Utils.error(this, "Sorry, can't load collection details."));
		},

		showSelectedProcessInfo() {
			this.showProcessInfo(this.$refs.processes.value);
		},

		showProcessInfo(id) {
			const info = this.processes.find(p => p.id == id);
			EventBus.$emit('showComponentModal', id, 'ProcessPanel', {
				process: info,
				version: this.connection.capabilities().apiVersion()
			});
		},

		insertCollection() {
			EventBus.$emit('addCollectionToEditor', this.$refs.collection.value);
		},

		insertProcess() {
			EventBus.$emit('addProcessToEditor', this.$refs.processes.value);
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
	padding: 5px;
	vertical-align: middle;
}
.server-toolbar {
	display: flex;
    flex-direction: row;
    align-items: center;
}
.discovery-toolbar {
	margin-top: 5px;
	margin-left: -1em;
	display: flex;
	flex-wrap: wrap;
}
.collections-toolbar, .processes-toolbar {
	flex: 1;
	display: flex;
    flex-direction: row;
    align-items: center;
	width: 50%;
	min-width: 250px;
	padding-left: 1em;
}
#collection, #processes, #serverUrl {
	flex-grow: 1;
	margin-left: 0.2em;
	min-width: 100px;
}
</style>