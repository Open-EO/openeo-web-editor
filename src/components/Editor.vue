<template>
	<Tabs class="editor" ref="tabs" id="customProcessContent" position="bottom">
		<Tab id="visual" name="Visual Model" icon="fa-project-diagram" :selected="true" :allowShow="canSwitchView" @show="showModel">
			<VisualEditor class="visualEditorTab" ref="graphBuilder" :editable="editable" :parent="parent" :parentSchema="parentSchema" :value="modelValue" @input="commit" @error="onError" :title="title" :id="id + '_visual'" :showDiscoveryToolbar="showDiscoveryToolbar" :defaultValue="defaultValue">
				<template #file-toolbar><slot name="file-toolbar"></slot></template>
				<template #toolbar><slot name="toolbar"></slot></template>
			</VisualEditor>
		</Tab>
		<Tab id="source" name="Code" icon="fa-code" :allowShow="canSwitchView" @show="showCode">
			<TextEditor class="textEditorTab" ref="sourceEditor" :editable="editable" :value="codeValue" @input="commit" @error="onError" :title="title" :id="id + '_text'" language="processgraph">
				<template #file-toolbar><slot name="file-toolbar"></slot></template>
				<template #toolbar><slot name="toolbar"></slot></template>
			</TextEditor>
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
		id: {
			type: String,
			default: () => `editor_${Date.now()}`
		},
		editable: {
			type: Boolean,
			default: true
		},
		value: {
			type: Object,
			default: () => null
		},
		title: {
			type: String
		},
		parent: {
			type: Object,
			default: null
		},
		parentSchema: {
			type: Object,
			default: null
		},
		showDiscoveryToolbar: {
			type: Boolean,
			default: false
		},
		defaultValue: {}
	},
	watch: {
		value() {
			this.updateTab();
		}
	},
	data() {
		return {
			modelValue: null,
			codeValue: null,
			error: null
		};
	},
	mounted() {
		this.updateTab();
	},
	methods: {
		...Utils.mapActions(['loadProcess']),
		showModel() {
			this.error = null;
			this.modelValue = this.value;
		},
		showCode() {
			this.error = null;
			this.codeValue = this.value;
			this.$refs.sourceEditor.updateState();
		},
		updateTab() {
			if (this.$refs.tabs.getActiveTabId() === 'source') {
				this.showCode();
			}
			else {
				this.showModel();
			}
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
		async insertProcess(node) {
			try {
				await this.loadProcess({id: node.process_id, namespace: node.namespace});
				this.activeEditor().insertProcess(node);
			} catch(error) {
				Utils.exception(this, error);
			}
		},
		canSwitchView() {
			if (this.editable && this.error !== null) {
				Utils.exception(this, this.error, 'Process Invalid Error');
				return false;
			}
			return true;
		}

	}
}
</script>

<style lang="scss">
.editor {
	.sourceHeader {
		padding: 5px;
		border-bottom: 1px solid #ddd;
		display: flex;
		justify-content: flex-end;
		background-color: #fff;

		strong {
			display: block;
			margin: auto 0;
			flex-grow: 1;
		}
	}
	.sourceToolbar {
		text-align: right;
	}
	.textEditorTab.textEditor {
		border: 0;
	}
	&.vue-component.tabs.boxed > .tabsBody > .tabContent {
		overflow: hidden;
	}
}
</style>