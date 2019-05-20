<template>
	<div class="sourceHeader">
		<h3 v-if="scriptName">{{ scriptName }}</h3>
		<div class="sourceToolbar">
			<slot></slot>
			<span class="sepl">
				<button v-if="editable" type="button" @click="newScript" title="Clear current script / New script"><i class="fas fa-file"></i></button>
				<button v-if="editable" type="button" @click="openScriptChooser" title="Load script from local storage"><i class="fas fa-folder-open"></i></button>
				<button type="button" @click="saveScript" title="Save script to local storage"><i class="fas fa-save"></i></button>
			</span>
			<button type="button" @click="executeProcessGraph" title="Run current process graph and view results" class="sepl" v-if="editable && this.supports('computeResult')"><i class="fas fa-play"></i></button>
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
		}
	},
	data() {
		return {
			scriptName: ''
		};
	},
	computed: {
		...Utils.mapState('server', ['connection']),
		...Utils.mapState('editor', ['storedScripts']),
		...Utils.mapGetters('server', ['supports'])
	},
	methods: {
		...Utils.mapMutations('editor', ['addScript', 'removeScript']),

		newScript() {
			var confirmed = confirm("Do you really want to clear the existing script to create a new one?");
			if (confirmed) {
				this.onClear();
				this.scriptName = null;
			}
		},

		loadScript(name) {
			var pg = this.storedScripts[name];
			if (pg) {
				this.onInsert(pg);
				this.scriptName = name;
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
			var name = prompt("Name for the script:", this.scriptName);
			if (!name) {
				return;
			}
			this.onStore(script => {
				this.addScript({name, script});
				this.scriptName = name;
			});
		},

		executeProcessGraph() {
			EventBus.$emit('getProcessGraph', script => {
				Utils.info(this, 'Data requested. Please wait...');
				this.connection.execute(script)
					.then(data => EventBus.$emit('showInViewer', data))
					.catch(error => Utils.exception(this, error, 'Sorry, could not execute process graph.'));
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
