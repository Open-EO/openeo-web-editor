<template>
	<Tabs ref="tabs" id="processGraphContent">
		<Tab id="visual" name="Visual Model" icon="fa-code-branch" :selected="true" :onBeforeShow="prepareProcessGraph" :onShow="transferProcessGraph">
			<template v-slot:tab="{ tab }">
				<VisualEditor ref="graphBuilder" :active="tab.active" :editable="editable" :value="processGraph" :id="id + '_visual'" :enableClear="enableClear" :enableExecute="enableExecute" :enableLocalStorage="enableLocalStorage" />
			</template>
		</Tab>
		<Tab id="source" name="Process Graph" icon="fa-code" :onBeforeShow="prepareProcessGraph" :onShow="transferProcessGraph">
			<template v-slot:tab="{ tab }">
				<TextEditor ref="sourceEditor" :active="tab.active" :editable="editable" :value="processGraph" :id="id + '_text'" :enableClear="enableClear" :enableExecute="enableExecute" :enableLocalStorage="enableLocalStorage" />
			</template>
		</Tab>
	</tabs>
</template>

<script>
import EventBus from '../eventbus.js';
import Utils from '../utils.js';
import Tabs from './Tabs.vue';
import Tab from './Tab.vue';
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
		}
	},
	data() {
		return {
			pgToInsert: null
		};
	},
	computed: {
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
		}
	},
	methods: {
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
			this.activeEditor.getProcessGraph(success, failure, passNull);
		},

		insertProcessGraph(pg) {
			this.activeEditor.insertProcessGraph(pg);
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

		transferProcessGraph() {
			this.insertProcessGraph(this.pgToInsert);
			this.pgToInsert = null;
		}

	}
}
</script>
