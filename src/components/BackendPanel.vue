<template>
  <div id="backendPanel" class="toolbar">
	<div v-show="$config.allowServerChange">
		<div class="server-toolbar">
		<h3>Server: <input type="text" id="serverUrl" ref="serverUrl" value="" /> <button  @click="changeServerUrl">Change</button></h3>
		</div>
		<div class="auth-toolbar">
		<button id="authenticate" @click="authenticate">Authenticate</button>
		</div>
		<hr />
	</div>
    <div class="data-toolbar">
      Data: <select id="data" ref="data"></select> <button id="insertData" @click="insertDataToEditor">+</button>
    </div>
    <div class="processes-toolbar">
      Processes: <select id="processes" ref="processes"></select> <button id="insertProcesses" @click="insertProcessToEditor">+</button>
    </div>
    <div class="vis-toolbar">
      Visualizations: <select id="visualizations">
        <option value="">None</option>
        <option value="custom">Custom function</option>
      </select> <button id="insertVisualizations">+</button>
    </div>
  </div>
</template>

<script>
import EventBus from '../eventbus.js';

export default {
	name: 'BackendPanel',
	props: ['serverUrl'],
	data() {
		return {}
	},
	mounted() {
		this.$refs.serverUrl.value = this.serverUrl;

		this.setVisualizations();
		this.$OpenEO.Data.get().then(this.setDiscoveredData);
		this.$OpenEO.Processes.get().then(this.setDiscoveredProcesses);
	},
	methods: {

		changeServerUrl() {
			var url = this.$refs.serverUrl.value;
			if (url && url != this.serverUrl) {
				EventBus.$emit('changeServerUrl', url);
			}
		},
		
		authenticate() {
			alert("Sorry, authentication is not implemented yet.");
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
	
		setDiscoveredData: function(data) {
			var select = document.getElementById('data');
			for (var i in data) {
				this._makeOption(select, null, data[i].product_id, data[i].description);
			}
		},
		
		setDiscoveredProcesses: function(data) {
			var select = document.getElementById('processes');
			for (var i in data) {
				this._makeOption(select, null, data[i].process_id, data[i].description);
			}
		},
		
		setVisualizations: function() {
			var select = document.getElementById('visualizations');
			for (var key in this.$OpenEO.Visualizations) {
				this._makeOption(select, key, this.$OpenEO.Visualizations[key].name);
			}
			document.getElementById('insertVisualizations').addEventListener('click', this._insertVisualization);
		},

		_makeOption: function(select, key, title, description) {
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
	
	_insertVisualization: function() {
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
		else if (typeof this.$OpenEO.Visualizations[select.value] !== 'undefined') {
			var argsCode = '';
			var argList = [];
			for(var key in this.$OpenEO.Visualizations[select.value].arguments) {
				var arg = this.$OpenEO.Visualizations[select.value].arguments[key];
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
