<template>
	<div id="SourceEnvironment">
		<h3>Script: <em id="scriptName">{{ scriptName }}</em></h3>
		<div id="sourceCodeEditor"></div>
		<button @click="executeScript" title="Run current script and view results" v-if="openEO.Capabilities.executeJob()"><i class="fas fa-play"></i> Execute</button>
		<button @click="newScript" title="Clear current script / New script"><i class="fas fa-file"></i> New</button>
		<button @click="loadScript" title="Load script from local storage"><i class="fas fa-folder-open"></i> Load</button>
		<button @click="saveScript" title="Save script to local storage"><i class="fas fa-save"></i> Save</button>
		<button @click="downloadScript" title="Download script"><i class="fas fa-download"></i> Download</button>
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
	props: ['openEO'],
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
			editor: null,
			defaultScript: `// Create the process graph
OpenEO.Editor.ProcessGraph = OpenEO.ImageCollection.create('Sentinel2A-L1C')
	.filter_daterange("2018-01-01","2018-01-31")
	.NDVI("B04","B08")
	.max_time();`
		}
	},
	mounted() {
		this.editor = CodeMirror(document.getElementById('sourceCodeEditor'), this.editorOptions);
		this.editor.setValue(this.defaultScript);
		EventBus.$on('addToSource', this.insertToEditor);
		EventBus.$on('evalScript', this.evalScript);
	},
	methods: {
		evalScript(callback) {
			var OpenEO = this.openEO;
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
			if (script) {
				eval(script);
			}

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

			callback(OpenEO.Editor);
		},

		clearEditor() {
			this.editor.setValue('');
			this.scriptName = '';
		},

		storageName(name) {
			return "script." + name.replace('.', '_');
		},

		executeScript() {
			var format = prompt('Please specify the file format:', '');
			if (format === null) {
				return;
			}
			EventBus.$emit('evalScript', (script) => {
				this.$utils.info(this, 'Data requested. Please wait...');
				script.ProcessGraph.execute({format: format})
					.then(data => {
						EventBus.$emit('showInViewer', data, script);
					})
					.catch(error => {
						this.$utils.error(this, 'Sorry, could not execute script.');
					});
			});
		},

		newScript() {
			var confirmed = confirm("Do you really want to clear the existing script to create a new one?");
			if (confirmed) {
				this.clearEditor();
			}
		},
		
		loadScript() {
			var name = prompt("Name of the script to load:");
			if (!name) {
				return;
			}
			var code = localStorage.getItem(this.storageName(name));
			if (code) {
				this.editor.setValue(code);
				this.scriptName = name;
			}
			else {
				this.$utils.info(this, 'No script with the name "' + name + '" found.');
			}
		},
		
		saveScript() {
			var name = prompt("Name for the script:", this.scriptName);
			if (!name) {
				return;
			}
			localStorage.setItem(this.storageName(name), this.editor.getValue());
			this.scriptName = name;
		},
		
		downloadScript() {
			var name = this.scriptName;
			if (!name) {
				name = "openeo-script";
			}
			this.$utils.downloadData(this.editor.getValue(), name + ".js", "text/javascript");
		},

		insertToEditor(text) {
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
#newScript {
	margin-left: 3%;
}
</style>
