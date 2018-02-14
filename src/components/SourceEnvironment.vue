<template>
	<div id="SourceEnvironment">
		<h3>Script: <em id="scriptName">{{ scriptName }}</em></h3>
		<div id="sourceCodeEditor"></div>
		<button @click="runScript">Run</button>
		<button @click="newScript">New</button>
		<button @click="loadScript">Load</button>
		<button @click="saveScript">Save</button>
		<button @click="downloadScript">Download</button>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';

import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/hint/show-hint.css';

import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/hint/javascript-hint.js';
import 'codemirror/mode/javascript/javascript.js';
import CodeMirror from 'codemirror';

export default {
	name: 'SourceEnvironment',
	data() {
		return {
			scriptName: '',
			editorOptions: {
				mode: 'javascript',
				indentUnit: 4,
				lineNumbers: true,
				extraKeys: {
					"Ctrl-Space": "autocomplete"
				}
			},
			editor: null
		}
	},
	mounted() {
		this.editor = CodeMirror(document.getElementById('sourceCodeEditor'), this.editorOptions);
		var value = `// Create the process graph
OpenEO.Editor.ProcessGraph = OpenEO.ImageCollection.create('Sentinel2A-L1C')
	.filter_daterange("2018-01-01","2018-01-31")
	.NDI(3,8)
	.max_time();`;
		this.editor.setValue(value);

		EventBus.$on('addToSource', this.insertToEditor);
	},
	methods: {
		runScript() {
			var OpenEO = this.$OpenEO;
			OpenEO.Editor = {
				ProcessGraph: {},
				Visualization: {
					function: undefined, // Don't use null, typeof null is object in JS.
					args: {}
				}
			};
			var script = this.editor.getSelection();
			if (!script) {
				script = this.editor.getValue();
			}
			if (!script) {
				return;
			}
			eval(script);

			OpenEO.Editor.Visualization.args = OpenEO.Editor.Visualization.args || {};
			// Modify visualization when user specified a pre-defined visualization
			if (typeof OpenEO.Editor.Visualization.function === 'object') {
				var vis = OpenEO.Editor.Visualization.function;
				OpenEO.Editor.Visualization.function = vis.callback;
				// Set default arguments when not given by user
				if (typeof vis.arguments !== 'undefined') {
					for(var key in vis.arguments) {
						if (typeof OpenEO.Editor.Visualization.args[key] === 'undefined') {
							OpenEO.Editor.Visualization.args[key] = vis.arguments[key].defaultValue;
						}
					}
				}
			}

			// Execute job
			OpenEO.Jobs.create(OpenEO.Editor.ProcessGraph)
				.then(data => {
					EventBus.$emit('updateMapTilesWithUrl', OpenEO.Jobs.getWcsPath(data.job_id));
				}).catch(errorCode => {
					alert('Sorry, could not create an OpenEO job. (' + errorCode + ')');
				});
		},

		newScript() {
			var confirmed = confirm("Do you really want to clear the existing script to create a new one?");
			if (confirmed) {
				this.editor.setValue('');
				this.scriptName = '';
			}
		},
		
		loadScript() {
			var name = prompt("Name of the script to load:");
			if (!name) {
				return;
			}
			var code = localStorage.getItem(name);
			if (code) {
				this.editor.setValue(code);
				this.scriptName = name;
			}
			else {
				alert('No script with this name found.');
			}
		},
		
		saveScript() {
			var name = prompt("Name for the script:", this.scriptName);
			if (!name) {
				return;
			}
			localStorage.setItem(name, this.editor.getValue());
			this.scriptName = name;
		},
		
		downloadScript() {
			var downloadData = (function () {
				var a = document.createElement("a");
				document.body.appendChild(a);
				a.style = "display: none";
				return function (data, fileName) {
					var blob = new Blob([data], {type: "text/javascript"});
					var url = window.URL.createObjectURL(blob);
					a.href = url;
					a.download = fileName;
					a.click();
					window.URL.revokeObjectURL(url);
				};
			}());
			var name = this.scriptName;
			if (!name) {
				name = "openeo-script";
			}
			downloadData(this.editor.getValue(), name + ".js");
		},

		insertToEditor: function(text) {
			this.editor.replaceSelection(text);
		}

	}
}
</script>

<style scoped>
#SourceEnvironment button {
	margin: 5px;
	width: 10%;
	min-width: 100px;
}
h3 {
	padding: 5px;
}
#runScript {
	font-weight: bold;
}
#newScript {
	margin-left: 3%;
}
</style>
