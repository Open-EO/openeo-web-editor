<template>
	<div class="dataViewer">
		<pre class="text" v-if="isScalar">{{ content }}</pre>
		<em class="text" v-else-if="isNodata">No data retrieved.</em>
		<Tabs v-else :id="tabsId" position="bottom">
			<Tab id="visual" name="Visual" icon="fa-list" :selected="true">
				<ObjectTree class="tree" :data="content" />
			</Tab>
			<Tab id="source" name="Code" icon="fa-code" @show="showCode">
				<TextEditor class="textEditorTab" ref="sourceEditor" :editable="false" :value="content" :id="tabsId + '_text'" :language="codeLanguage" />
			</Tab>
		</Tabs>
	</div>
</template>

<script>
import ObjectTree from '@openeo/vue-components/components/ObjectTree.vue';
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import Tab from '@openeo/vue-components/components/Tab.vue';
import TextEditor from '../TextEditor.vue';
import JSON_ from '../../formats/json';

let tabId = 0;

export default {
	name: 'DataViewer',
	props: {
		data: {
			type: Object,
			required: true
		}
	},
	components:  {
		ObjectTree,
		Tabs,
		Tab,
		TextEditor
	},
	computed: {
		isScalar() {
			return typeof this.content !== 'object';
		},
		isNodata() {
			return this.content === null || typeof this.content === 'undefined';
		}
	},
	data() {
		return {
			content: null,
			tabsId: "data_viewer_" + tabId++,
			codeLanguage: null
		};
	},
	created() {
		if (this.data instanceof JSON_) {
			this.codeLanguage = 'json';
		}
		this.content = this.data.getData();
	},
	mounted() {
		this.$emit('mounted', this);
	},
	methods: {
		showCode() {
			this.$refs.sourceEditor.updateState();
		}
	}
};
</script>

<style lang="scss" scoped>
.dataViewer {
	width: 100%;
	height: 100%;

	.text,
	.tree {
		padding: 5px;
	}

	.tabs.boxed {
		border: 0;
	}
}
</style>
