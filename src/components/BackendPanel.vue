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
				<option v-for="d in data" :key="d.product_id" :value="d.product_id" :title="d.description">{{ d.product_id }}</option>
			</select>
			<button id="insertData" @click="insertDataToEditor" title="Insert into script"><i class="fas fa-plus"></i></button>
			<button @click="showDataInfo" title="Show details" v-show="openEO.Capabilities.dataInfo()"><i class="fas fa-info"></i></button>
		</div>
		<div class="processes-toolbar" v-show="showProcessSelector()">
			Processes: <select id="processes" ref="processes">
				<option v-for="p in processes" :key="p.process_id" :value="p.process_id" :title="p.description">{{ p.process_id }}</option>
			</select>
			<button id="insertProcesses" @click="insertProcessToEditor" title="Insert into script"><i class="fas fa-plus"></i></button>
			<button @click="showProcessInfo" title="Show details" v-show="openEO.Capabilities.processInfo()"><i class="fas fa-info"></i></button>
		</div>
		<div class="vis-toolbar">
			Visualizations: <select id="visualizations">
				<option value="">None</option>
				<option value="custom">Custom function</option>
				<optgroup label="Pre-defined">
					<option v-for="(v, k) in openEO.Visualizations" :key="k" :value="k">{{ v.name }}</option>
				</optgroup>
			</select> <button id="insertVisualizations" title="Insert into script" @click="insertVisualization"><i class="fas fa-plus"></i></button>
		</div>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';

export default {
	name: 'BackendPanel',
	props: ['openEO'],
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
			return this.openEO.Capabilities.data() && this.data.length > 0;
		},

		showProcessSelector() {
			return this.openEO.Capabilities.processes() && this.processes.length > 0;
		},

		showServerSelector() {
			EventBus.$emit('showComponentModal', 'Select previously used server', 'List', {
				items: this.serverUrls,
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
			if (this.openEO.Capabilities.data()) {
				this.openEO.Data.get()
					.then(this.setDiscoveredData)
					.catch(error => this.setDiscoveredData([]));
			}
			if (this.openEO.Capabilities.processes()) {
				this.openEO.Processes.get()
					.then(this.setDiscoveredProcesses)
					.catch(error => this.setDiscoveredProcesses([]));
			}
		},

		updateServerUrlFromInput() {
			var newUrl = this.$refs.serverUrl.value;
			if (typeof newUrl === 'string' && newUrl != this.openEO.API.baseUrl) {
				EventBus.$emit('changeServerUrl', newUrl);
			}
		},

		updateServerUrlTo(newUrl) {
			this.$refs.serverUrl.value = newUrl;
			this.updateServerUrlFromInput();
		},

		getServerInfo() {
			var info = {
				url: this.openEO.API.baseUrl,
				supportedEndpoints: this.openEO.Capabilities.rawData,
				supportedWebServices: this.openEO.SupportedServices,
				supportedOutputFormats: this.openEO.SupportedOutputFormats
			};
			EventBus.$emit('showModal', 'Server information', info);
		},

		showDataInfo() {
			this.openEO.Data.getById(this.$refs.data.value)
				.then(data => {
					EventBus.$emit('showModal', 'Data: ' + this.$refs.data.value, data);
				})
				.catch(error => this.$utils.error(this, 'Sorry, can\'t load process details.'));
		},

		showProcessInfo() {
			this.openEO.Processes.getById(this.$refs.processes.value)
				.then(data => {
					EventBus.$emit('showModal', 'Process: ' + this.$refs.processes.value, data);
				})
				.catch(error => this.$utils.error(this, 'Sorry, can\'t load process details.'));
		},

		insertDataToEditor() {
			this.insertToEditor(this.$refs.data.value);
		},

		insertProcessToEditor() {
			this.insertToEditor(this.$refs.processes.value);
		},

		insertToEditor(code) {
			EventBus.$emit('addToSource', code);
		},
	
		setDiscoveredData(data) {
			this.data = [];
			for (var i in data) {
				if (typeof data[i].product_id === 'undefined') {
					continue;
				}
				this.data.push(data[i]);
			}
		},
		
		setDiscoveredProcesses(processes) {
			this.processes = [];
			for (var i in processes) {
				if (typeof processes[i].process_id === 'undefined') {
					continue;
				}
				this.processes.push(processes[i]);
			}
		},
	
	insertVisualization() {
		var select = document.getElementById('visualizations');
		var code;
		if (select.value === 'custom') {
			code = `
OpenEO.Editor.Visualization = {
	function: function(input) {
		// ToDo: Implement your custom visualization
	}
};
`;
		}
		else if (typeof this.openEO.Visualizations[select.value] !== 'undefined') {
			var argsCode = '';
			var argList = [];
			for(var key in this.openEO.Visualizations[select.value].arguments) {
				var arg = this.openEO.Visualizations[select.value].arguments[key];
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
OpenEO.Editor.Visualization = {
	function: OpenEO.Visualizations.` + select.value + argsCode + `
};
`;
		}
		else {
			code = '';
		}
		this.insertToEditor(code);
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