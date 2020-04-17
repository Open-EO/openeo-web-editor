<template>
	<Tabs class="editor" ref="tabs" id="customProcessContent">
		<Tab id="visual" name="Visual Model" icon="fa-code-branch" :selected="true" :allowShow="prepareProcess" @show="transferProcess">
			<template #default="{ tab }">
				<VisualEditor ref="graphBuilder" :active="tab.active" :editable="editable" :value="process" :id="id + '_visual'" :isMainEditor="isMainEditor" />
			</template>
		</Tab>
		<Tab id="source" name="Code" icon="fa-code" :allowShow="prepareProcess" @show="transferProcess">
			<template #default="{ tab }">
				<TextEditor ref="sourceEditor" :active="tab.active" :editable="editable" :value="process" :id="id + '_text'" :isMainEditor="isMainEditor" />
			</template>
		</Tab>
	</Tabs>
</template>

<script>
import Utils from '../utils.js';
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import Tab from '@openeo/vue-components/components/Tab.vue';
import VisualEditor from './VisualEditor.vue';
import TextEditor from './TextEditor.vue';
import stringify from 'fast-stable-stringify';

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
		process: {
			type: Object,
			default: null
		},
		isMainEditor: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			lastProcessToInsert: null,
			processToInsert: this.process
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
		getCustomProcess(success, failure = null, passNull = false) {
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
			this.activeEditor().getCustomProcess(success, failure, passNull);
		},
		insertProcess(id) {
			this.activeEditor().insertProcess(id);
		},
		insertCollection(id) {
			this.activeEditor().insertCollection(id);
		},
		insertCustomProcess(pg) {
			this.activeEditor().insertCustomProcess(pg);
		},
		prepareProcess() {
			if (this.editable) {
				return new Promise((resolve, reject) => {
					this.getCustomProcess(
						pg => {
							this.processToInsert = pg;
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
				this.processToInsert = this.process;
				return true;
			}
		},

		transferProcess(tab) {
			this.activeEditor().onShow();
			// Don't update process graph if it hasn't changed.
			// use fast-stable-stringify as it's stable/deterministic. 
			if (!this.editable || !this.lastProcessToInsert || stringify(this.processToInsert) !== this.lastProcessToInsert) {
				this.insertCustomProcess(this.processToInsert);
				this.lastProcessToInsert = stringify(this.processToInsert);
			}
			this.processToInsert = null;
		}

	}
}
</script>