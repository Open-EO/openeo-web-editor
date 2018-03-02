<template>
  <div id="backendPanel" class="toolbar">
	<div v-show="$config.allowServerChange">
		<div class="server-toolbar">
		<h3>Server: <input type="text" id="serverUrl" ref="serverUrl" value="" />
		<button  @click="updateServerUrl" title="Change server"><i class="fas fa-check"></i></button></h3>
		</div>
		<div class="auth-toolbar">
		</div>
		<hr />
	</div>
    <div class="data-toolbar" v-show="showDataSelector()">
      Data: <select id="data" ref="data"></select>
	  <button id="insertData" @click="insertDataToEditor" title="Insert into script"><i class="fas fa-plus"></i></button>
	  <button @click="showDataInfo" title="Show details" v-show="openEO.Capabilities.dataInfo()"><i class="fas fa-info"></i></button>
    </div>
    <div class="processes-toolbar" v-show="showProcessSelector()">
      Processes: <select id="processes" ref="processes"></select>
	  <button id="insertProcesses" @click="insertProcessToEditor" title="Insert into script"><i class="fas fa-plus"></i></button>
	  <button @click="showProcessInfo" title="Show details" v-show="openEO.Capabilities.processInfo()"><i class="fas fa-info"></i></button>
    </div>
    <div class="vis-toolbar">
      Visualizations: <select id="visualizations">
        <option value="">None</option>
        <option value="custom">Custom function</option>
      </select> <button id="insertVisualizations" title="Insert into script"><i class="fas fa-plus"></i></button>
    </div>
  </div>
</template>

<script>
import EventBus from '../eventbus.js';

export default {
	name: 'BackendPanel',
	props: ['openEO','serverUrl'],
	data() {
		return {
			processes: [],
			data: []
		};
	},
	mounted() {
		this.$refs.serverUrl.value = this.serverUrl;
		this.setVisualizations();
		this.discoverData();
		EventBus.$on('serverChanged', this.discoverData);
	},
	methods: {

		showDataSelector() {
			return this.openEO.Capabilities.data() && this.data.length > 0;
		},

		showProcessSelector() {
			return this.openEO.Capabilities.processes() && this.processes.length > 0;
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

		updateServerUrl() {
			var url = this.$refs.serverUrl.value;
			if (typeof url === 'string' && url != this.serverUrl) {
				EventBus.$emit('changeServerUrl', url);
			}
		},

		showDataInfo() {
			this.openEO.Data.getById(this.$refs.data.value)
				.then(data => {
					EventBus.$emit('showModal', 'Data: ' + this.$refs.data.value, data);
				})
				.catch(error => this.$utils.error('Sorry, can\'t load process details.'));
		},

		showProcessInfo() {
			this.openEO.Processes.getById(this.$refs.processes.value)
				.then(data => {
					EventBus.$emit('showModal', 'Process: ' + this.$refs.processes.value, data);
				})
				.catch(error => this.$utils.error('Sorry, can\'t load process details.'));
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
			var select = document.getElementById('data');
			this._truncateList(select);
			for (var i in data) {
				if (typeof data[i].product_id === 'undefined') {
					continue;
				}
				this.data.push(data[i]);
				this._makeOption(select, null, data[i].product_id, data[i].description);
			}
		},
		
		setDiscoveredProcesses(processes) {
			this.processes = [];
			var select = document.getElementById('processes');
			this._truncateList(select);
			for (var i in processes) {
				if (typeof processes[i].process_id === 'undefined') {
					continue;
				}
				this.processes.push(processes[i]);
				this._makeOption(select, null, processes[i].process_id, processes[i].description);
			}
		},
		
		setVisualizations() {
			var select = document.getElementById('visualizations');
			for (var key in this.openEO.Visualizations) {
				this._makeOption(select, key, this.openEO.Visualizations[key].name);
			}
			document.getElementById('insertVisualizations').addEventListener('click', this._insertVisualization);
		},

		_truncateList(select) {
			while (select.firstChild) {
				select.removeChild(select.firstChild);
			}
		},

		_makeOption(select, key, title, description) {
			var option = document.createElement("option");
			var text = document.createTextNode(title);
			option.appendChild(text);
			if (!key) {
				option.value = title;
			}
			else {
				option.value = key;
			}
			if (description) {
				option.title = description;
			}
			select.appendChild(option);
		},
	
	_insertVisualization() {
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
#serverUrl {
	width: 300px;
	font-family: monospace;
}
</style>
