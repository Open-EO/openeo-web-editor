<template>
	<Tabs class="editor" ref="tabs" id="customProcessContent" position="bottom">
		<Tab id="visual" name="Visual Model" icon="fa-project-diagram" :selected="true" :allowShow="canSwitchView" @show="showModel">
			<VisualEditor class="visualEditorTab" ref="graphBuilder" :editable="editable" :pgParameters="pgParameters" :value="modelValue" @input="commit" @error="onError" :id="id + '_visual'" :showDiscoveryToolbar="showDiscoveryToolbar" />
		</Tab>
		<Tab id="source" name="Code" icon="fa-code" :allowShow="canSwitchView" @show="showCode">
			<TextEditor class="textEditorTab" ref="sourceEditor" :editable="editable" :value="codeValue" @input="commit" @error="onError" :id="id + '_text'" language="processgraph" />
		</Tab>
	</Tabs>
</template>

<script>
import Utils from '../utils.js';
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import Tab from '@openeo/vue-components/components/Tab.vue';
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
		value: {
			type: Object,
			default: () => null
		},
		pgParameters: {
			type: Array,
			default: () => []
		},
		showDiscoveryToolbar: {
			type: Boolean,
			default: false
		}
	},
	watch: {
		value(value, oldValue) {
			if (this.$refs.tabs.getActiveTabId() === 'source') {
				this.showCode();
			}
			else {
				this.showModel();
			}
		}
	},
	data() {
		return {
			modelValue: null,
			codeValue: null,
			error: null
		};
	},
	methods: {
		showModel() {
			this.error = null;
			this.modelValue = this.value;
		},
		showCode() {
			this.error = null;
			this.codeValue = this.value;
		},
		commit(value) {
			this.error = null;
			this.$emit('input', value);
		},
		onError(error) {
			this.error = error;
		},
		activeEditor() {
			if (this.$refs.tabs.getActiveTabId() === 'source') {
				return this.$refs.sourceEditor;
			}
			else {
				return this.$refs.graphBuilder;
			}
		},
		insertProcess(id) {
			this.activeEditor().insertProcess(id);
		},
		insertCollection(id) {
			this.activeEditor().insertCollection(id);
		},
		canSwitchView() {
			if (this.editable && this.error !== null) {
				Utils.exception(this, this.error, 'Process invalid');
				return false;
			}
			return true;
		}

	}
}
</script>

<style>
.textEditorTab.textEditor {
	border: 0;
}
</style>