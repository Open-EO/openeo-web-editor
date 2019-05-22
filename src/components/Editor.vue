<template>
	<Tabs ref="tabs" id="processGraphContent">
		<Tab id="visual" name="Visual Model" icon="fa-code-branch" :selected="true" :onActivate="changeEditor">
			<template v-slot:tab="{ tab }">
				<VisualEditor ref="graphBuilder" :active="tab.active" :editable="editable" :value="processGraph" :id="id + '_visual'" />
			</template>
		</Tab>
		<Tab id="source" name="Process Graph" icon="fa-code" :onActivate="changeEditor">
			<template v-slot:tab="{ tab }">
				<TextEditor ref="sourceEditor" :active="tab.active" :editable="editable" :value="processGraph" :id="id + '_text'" />
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
		}
	},
	computed: {
		activeEditor() {
			if (this.$refs.tabs.getActiveTab() === 'source') {
				return this.$refs.sourceEditor;
			}
			else {
				return this.$refs.graphBuilder;
			}
		},
		inactiveEditor() {
			if (this.$refs.tabs.getActiveTab() !== 'source') {
				return this.$refs.sourceEditor;
			}
			else {
				return this.$refs.graphBuilder;
			}
		}
	},
	methods: {

		getProcessGraph(callback, silent = false, passNull = false) {
			this.activeEditor.getProcessGraph(callback, silent, passNull);
		},

		insertProcessGraph(pg) {
			this.activeEditor.insertProcessGraph(pg);
		},

		changeEditor() {
			if (this.editable) {
				this.inactiveEditor.getProcessGraph(pg => this.activeEditor.insertProcessGraph(pg), true, true);
			}
		}

	}
}
</script>
