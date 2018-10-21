<template>
	<div id="backendPanel">
		<div class="server-toolbar" v-show="$config.allowServerChange">
			<h3>Server:</h3>
			<input id="serverUrl" ref="serverUrl" list="serverUrls" value="" />
			<button @click="showServerSelector" title="Select previously used server"><i class="fas fa-book"></i></button>
			<button @click="updateServerUrlFromInput" title="Change server"><i class="fas fa-check"></i></button>
		</div>
		<div class="info-toolbar">
			<button @click="getServerInfo" title="Get server information"><i class="fas fa-info"></i></button>
		</div>
		<div class="data-toolbar" v-show="showDataSelector()">
			Data: <select id="data" ref="data">
				<option v-for="d in data" :key="d.name" :value="d.name" :title="d.description">{{ d.name }}</option>
			</select>
			<button id="insertData" @click="insertDataToEditor" title="Insert into script"><i class="fas fa-plus"></i></button>
			<button @click="showDataInfo" title="Show details" v-show="capabilities && capabilities.hasFeature('describeCollection')"><i class="fas fa-info"></i></button>
		</div>
		<div class="processes-toolbar" v-show="showProcessSelector()">
			Processes: <select id="processes" ref="processes">
				<option v-for="p in processes" :key="p.name" :value="p.name" :title="p.description">{{ p.name }}</option>
			</select>
			<button id="insertProcesses" @click="insertProcessToEditor" title="Insert into script"><i class="fas fa-plus"></i></button>
			<button @click="showProcessInfo" title="Show details" v-show="capabilities && capabilities.hasFeature('listProcesses')"><i class="fas fa-info"></i></button>
		</div>
		<!-- ToDo: Move to Source/Model environment and make a modal, not adapted to visual model builder yet -->
<!--	<div class="vis-toolbar">
			Visualizations: <select id="visualizations">
				<option value="">None</option>
				<option value="custom">Custom function</option>
				<optgroup label="Pre-defined">
					<option v-for="(v, k) in this.visualizations" :key="k" :value="k">{{ v.name }}</option>
				</optgroup>
			</select> <button id="insertVisualizations" title="Insert into script" @click="insertVisualization"><i class="fas fa-plus"></i></button>
		</div> -->
	</div>
</template>

<script>
import EventBus from '../eventbus.js';

export default {
	name: 'BackendPanel',
	props: ['connection', 'capabilities', 'supportedOutputFormats', 'supportedServices', 'visualizations', 'visualization'],
	data() {
		return {
			processes: [],
			data: [],
			serverUrls: []
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

		showDataSelector() {
			return this.capabilities && this.capabilities.hasFeature('listCollections') && this.data.length > 0;
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
			this.$refs.serverUrl.value = url;
			if (this.serverUrls.indexOf(url) === -1) {
				this.serverUrls.push(url);
			}
		},

		discoverData() {
			if (this.capabilities && this.capabilities.hasFeature('listCollections')) {
				this.connection.listCollections()
					.then(this.setDiscoveredData)
					.catch(error => this.setDiscoveredData([]));
			}
			if (this.capabilities && this.capabilities.hasFeature('listProcesses') ) {
				this.connection.listProcesses()
					.then(this.setDiscoveredProcesses)
					.catch(error => this.setDiscoveredProcesses([]));
			}
		},

		updateServerUrlFromInput() {
			var newUrl = this.$refs.serverUrl.value;
			if (typeof newUrl === 'string' && newUrl.length > 0) {
				if (!this.connection || newUrl != this.connection.getBaseUrl()) {
					EventBus.$emit('changeServerUrl', newUrl);
				}
			}
			else {
				this.$utils.error(this, 'Please specify a valid server URL.');
			}
		},

		updateServerUrlTo(newUrl) {
			this.$refs.serverUrl.value = newUrl;
			this.updateServerUrlFromInput();
		},

		getServerInfo() {
			var info = {
				url: this.connection.getBaseUrl(),
				supportedEndpoints: this.capabilities.listFeatures(),
				supportedWebServices: this.supportedServices,
				supportedOutputFormats: this.supportedOutputFormats
			};
			EventBus.$emit('showModal', 'Server information', info);
		},

		showDataInfo() {
			this.connection.describeCollection(this.$refs.data.value)
				.then(data => {
					EventBus.$emit('showModal', 'Data: ' + this.$refs.data.value, data);
				})
				.catch(error => this.$utils.error(this, 'Sorry, can\'t load process details.'));
		},

		showProcessInfo() {
			const data = this.processes.find(p => p.name == this.$refs.processes.value);
			EventBus.$emit('showModal', 'Process: ' + this.$refs.processes.value, data);
		},

		insertDataToEditor() {
			EventBus.$emit('addDataToEditor', this.$refs.data.value);
		},

		insertProcessToEditor() {
			EventBus.$emit('addProcessToEditor', this.$refs.processes.value);
		},
	
		setDiscoveredData(data) {
			this.data = [];
			for (var i in data.collections) {
				if (typeof data.collections[i].name === 'undefined') {
					continue;
				}
				this.data.push(data.collections[i]);
			}
			EventBus.$emit('propagateData', this.data);
		},
		
		setDiscoveredProcesses(processes) {
			this.processes = [];
			for (var i in processes.processes) {
				if (typeof processes.processes[i].name === 'undefined') {
					continue;
				}
				this.processes.push(processes.processes[i]);
			}
			EventBus.$emit('propagateProcesses', this.processes);
		},
	
	insertVisualization() {
		var select = document.getElementById('visualizations');
		var code;
		if (select.value === 'custom') {
			code = `
this.visualization = {
	function: function(input) {
		// ToDo: Implement your custom visualization
	}
};
`;
		}
		else if (typeof this.visualizations[select.value] !== 'undefined') {
			var argsCode = '';
			var argList = [];
			for(var key in this.visualizations[select.value].arguments) {
				var arg = this.visualizations[select.value].arguments[key];
				var value = prompt(arg.description, JSON.stringify(arg.defaultValue));
				if (value !== null) {
					argList.push('"' + key + '": ' + value);
				}
				else {
					// User clicked 'Cancel' -> Abort inserting visualization
					return;
				}
			}
			if (argList.length > 0) {
				argsCode = `,
	args: {
		` + argList.join(",\r\n		") + `
	}`;
			}

			code = `
this.visualization = {
	function: this.visualizations.` + select.value + argsCode + `
};
`;
		}
		else {
			code = '';
		}
		EventBus.$emit('addSourceCode', code);
	},

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
.data-toolbar, .processes-toolbar, .info-toolbar {
	display: inline-block;
	margin-right: 3%;
}
.vis-toolbar {
	display: inline-block;
}
</style>