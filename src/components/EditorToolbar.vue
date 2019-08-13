<template>
	<div class="sourceHeader">
		<h3 v-if="scriptName">{{ scriptName }}</h3>
		<div class="sourceToolbar">
			<slot></slot>
			<span class="sepl" v-if="enableLocalStorage || enableClear">
				<button v-if="enableClear && editable" type="button" @click="newScript" title="Clear current script / New script"><i class="fas fa-file"></i></button>
				<button v-if="enableLocalStorage && editable" type="button" @click="openScriptChooser" title="Load script from local storage"><i class="fas fa-folder-open"></i></button>
				<button v-if="enableLocalStorage" type="button" @click="saveScript" title="Save script to local storage"><i class="fas fa-save"></i></button>
			</span>
			<button v-if="enableExecute && supports('computeResult')" type="button" @click="executeProcessGraph" title="Run current process graph and view results" class="sepl"><i class="fas fa-play"></i></button>
		</div>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';
import Utils from '../utils.js';

export default {
	name: 'EditorToolbar',
	props: {
		editable: {
			type: Boolean,
			default: true
		},
		onClear: {
			type: Function,
			required: true
		},
		onInsert: {
			type: Function,
			required: true
		},
		onStore: {
			type: Function,
			required: true
		},
		enableClear: {
			type: Boolean,
			default: true
		},
		enableLocalStorage: {
			type: Boolean,
			default: true
		},
		enableExecute: {
			type: Boolean,
			default: true
		}
	},
	computed: {
		...Utils.mapState('server', ['connection']),
		...Utils.mapState('editor', ['storedScripts', 'scriptName']),
		...Utils.mapGetters('server', ['supports'])
	},
	methods: {
		...Utils.mapMutations('editor', ['addScript', 'removeScript', 'setScriptName']),

		newScript() {
			var confirmed = confirm("Do you really want to clear the existing script to create a new one?");
			if (confirmed) {
				this.onClear();
				this.setScriptName(null);
			}
		},

		loadScript(name) {
			var pg = this.storedScripts[name];
			if (pg) {
				this.onInsert(pg);
				this.setScriptName(name);
				return true;  // to close the modal
			}
			else {
				Utils.info(this, 'No script with the name "' + name + '" found.');
				return false;  // to keep the modal open
			}
		},
		
		openScriptChooser() {
			EventBus.$emit(
				'showListModal', 
				'Select script to load',
				this.storedScripts,
				[
					{
						callback: (name) => this.loadScript(name)
					},
					{
						callback: (name) => this.removeScript(name),
						icon: 'trash',
						title: 'Delete script'
					}
				]
			);
		},

		saveScript() {
			var name = prompt("Name for the script:", typeof this.scriptName === 'string' ? this.scriptName : "");
			if (!name) {
				return;
			}
			this.onStore(script => {
				this.addScript({name, script});
				this.setScriptName(name);
			});
		},

		executeProcessGraph() {
			EventBus.$emit('getProcessGraph', script => {
				Utils.info(this, 'Data requested. Please wait...');
				this.connection.computeResult(script)
					.then(data => EventBus.$emit('showViewer', data))
					.catch(error => Utils.exception(this, error, 'Computation failed'));
			});
		},
	}
}
</script>


<style>
.sourceHeader {
	padding: 5px;
	border-bottom: 1px solid #ddd;
	display: flex;
	justify-content: flex-end;
	background-color: #fff;
}
.sourceHeader h3 {
	margin: auto 0;
	flex-grow: 1;
}
.sourceToolbar {
	text-align: right;
}
</style>
