<template>
	<Tabs class="editor" ref="tabs" id="processGraphContent">
		<Tab id="visual" name="Visual Model" icon="fa-code-branch" :selected="true" :allowShow="prepareProcessGraph" @show="transferProcessGraph">
			<template #default="{ tab }">
				<VisualEditor ref="graphBuilder" :active="tab.active" :editable="editable" :value="processGraph" :id="id + '_visual'" :enableClear="enableClear" :enableExecute="enableExecute" :enableLocalStorage="enableLocalStorage" :showDiscoveryToolbar="showDiscoveryToolbar" />
			</template>
		</Tab>
		<Tab id="source" name="Process Graph" icon="fa-code" :allowShow="prepareProcessGraph" @show="transferProcessGraph">
			<template #default="{ tab }">
				<TextEditor ref="sourceEditor" :active="tab.active" :editable="editable" :value="processGraph" :id="id + '_text'" :enableClear="enableClear" :enableExecute="enableExecute" :enableLocalStorage="enableLocalStorage" />
			</template>
		</Tab>
	</Tabs>
</template>

<script>
import Utils from '../utils.js';
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import Tab from '@openeo/vue-components/components/Tab.vue';
import ConnectionMixin from './ConnectionMixin.vue';
import VisualEditor from './VisualEditor.vue';
import TextEditor from './TextEditor.vue';

export default {
	name: 'Editor',
	components: {
		VisualEditor,
		TextEditor,
		Tabs,
		Tab
	},
	props: {
		id: String,
		editable: {
			type: Boolean,
			default: true
		},
		processGraph: {
			type: Object,
			default: null
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
		},
		showDiscoveryToolbar: {
			type: Boolean,
			default: true
		}
	},
	data() {
		return {
			lastPgToInsert: null,
			pgToInsert: null
		};
	},
	methods: {
		activeEditor() {
			if (this.$refs.tabs.getActiveTabId() === 'source') {
				return this.$refs.sourceEditor;
			}
			else {
				return this.$refs.graphBuilder;
			}
		},
		inactiveEditor() {
			if (this.$refs.tabs.getActiveTabId() !== 'source') {
				return this.$refs.sourceEditor;
			}
			else {
				return this.$refs.graphBuilder;
			}
		},
		getProcessGraph(success, failure = null, passNull = false) {
			if (failure === null) {
				failure = (message, exception = null) => {
					if (exception !== null) {
						Utils.exception(this, exception, message);
					}
					else {
						Utils.error(this, message);
					}
				};
			}
			this.activeEditor().getProcessGraph(success, failure, passNull);
		},
		insertProcess(id) {
			this.activeEditor().insertProcess(id);
		},
		insertCollection(id) {
			this.activeEditor().insertCollection(id);
		},
		insertProcessGraph(pg) {
			this.activeEditor().insertProcessGraph(pg);
		},
		prepareProcessGraph() {
			if (this.editable) {
				return new Promise((resolve, reject) => {
					this.getProcessGraph(
						pg => {
							this.pgToInsert = pg;
							resolve(true);
						},
						(message, exception) => {
							if (exception) {
								Utils.exception(this, exception, message);
							}
							// Don't show default error that the model is invalid
							// We resolve here as reject would lead to an error popping up from Vue.
							// We can resolve safely as we have handled and shown the exception.
							resolve(false);
						},
						true
					);
				});
			}
			else {
				this.pgToInsert = this.processGraph;
				return true;
			}
		},

		transferProcessGraph(tab) {
			this.activeEditor().onShow();
			// Don't update process graph if it hasn't changed
			// ToDo: Check whether JSON.stringify is deterministic, otherwise use object-hash or something similar. 
			if (!this.lastPgToInsert || JSON.stringify(this.pgToInsert) !== this.lastPgToInsert) {
				this.insertProcessGraph(this.pgToInsert);
				this.lastPgToInsert = JSON.stringify(this.pgToInsert);
			}
			this.pgToInsert = null;
		}

	}
}
</script>