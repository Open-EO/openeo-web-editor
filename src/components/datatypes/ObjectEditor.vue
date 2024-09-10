<template>
	<div class="object-editor" @drop="onDrop" @dragover="allowDrop">
		<template v-if="isTopLevel">
			<Tabs ref="tabs" id="object-tabs" position="bottom">
				<Tab id="visual" name="Visual" icon="fa-project-diagram" :selected="true" @show="showVisual">
					<ObjectEditorDnD v-if="visual" :parameter="parameter" :editable="editable" :schema="schema" :parent="parent" :context="context" :value="data" :isObject="isObject" ref="visual" @input="updateFromVisual" />
				</Tab>
				<Tab id="source" name="Code" icon="fa-code" @show="showCode">
					<TextEditor ref="sourceEditor" :editable="editable" :value="data" id="object-texteditor" language="json" @input="updateFromCode"></TextEditor>
				</Tab>
			</Tabs>
			<small v-if="editable && isObject" class="info">
				To easily import an object, you can drag &amp; drop a JSON file into this area.
			</small>
		</template>
		<template v-else>
			<ObjectEditorDnD :parameter="parameter" :editable="editable" :schema="schema" :parent="parent" :context="context" :value="data" :isObject="isObject" ref="visual" @input="updateFromVisual" />
		</template>
	</div>
</template>

<script>
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import Tab from '@openeo/vue-components/components/Tab.vue';

import ObjectEditorDnD from './ObjectEditorDnD.vue';
import TextEditor from '../TextEditor.vue';

import Utils from '../../utils';

export default {
	name: 'ObjectEditor',
	components: {
		ObjectEditorDnD,
		Tab,
		Tabs,
		TextEditor
	},
	data() {
		return {
			data: this.value,
			visual: true,
			isTopLevel: true
		};
	},
	props: {
		parameter: Object,
		editable: {
			type: Boolean,
			default: true
		},
		schema: Object,
		value: {},
		isObject: {
			type: Boolean,
			default: false
		},
		parent: Object,
		context: {}
	},
	watch: {
		value(value) {
			this.data = value;
		},
		data(data) {
			this.$emit('input', data);
		}
	},
	mounted() {
		// Check if there is another ObjectEditor in the parents.
		// If there's one we don't want to show the tabs, we only want code editing at the top level.
		let parent = this.$parent;
		while (parent) {
			if (parent.$options.name === 'ObjectEditor') {
				this.isTopLevel = false;
				break;
			}
			parent = parent.$parent
		}
	},
	methods: {
		showVisual() {
			this.visual = true;
		},
		showCode() {
			this.visual = false;
			this.$refs.sourceEditor.updateState();
		},
		updateFromCode(value) {
			if (!this.visual) {
				this.data = value;
			}
		},
		updateFromVisual(value) {
			if (this.visual) {
				this.data = value;
			}
		},
		allowDrop(event) {
			if (this.editable && this.isTopLevel) {
				event.preventDefault();
			}
		},
		onDrop(event) {
			// Read a files that have been dropped
			let files = event.dataTransfer.files;
			if (files.length === 1) {
				let file = event.dataTransfer.files[0];
				let jsonTypes = ['text/json', 'application/json', 'application/geo+json', 'text/plain'];
				let name = file.name.toLowerCase();
				let isJson = jsonTypes.includes(file.type) || name.endsWith('.geojson') || name.endsWith('.json');
				if (isJson) {
					var reader = new FileReader();
					reader.onload = async e => {
						let json;
						try {
							json = JSON.parse(e.target.result);
						} catch(error) {
							console.error(error);
							return Utils.error(this, "The provided file is not a valid JSON file");
						}
						if ((this.isObject && Utils.isObject(json)) || (!this.isObject && Array.isArray(json))) {
							this.data = json;
						}
						else {
							Utils.error(this, "The provided file doesn't seem to be a JSON file that contains an object");
						}
					};
					reader.onerror = error => Utils.exception(this, error, "Reading the file failed");
					reader.readAsText(file, "UTF-8");
				}
			}
			else {
				Utils.error(this, "Please provide a single JSON file");
			}
			return event.preventDefault();
		},
	}

}
</script>

<style lang="scss">
.object-editor .multiselect__content-wrapper {
	max-height: 200px !important;
}
</style>
<style lang="scss" scoped>
.object-editor {
	width: 100%;
	min-height: 400px;
	max-height: calc(70vh + 1.5em);
	display: flex;
	flex-direction: column;

	.multiselect__content-wrapper {
		max-height: 200px;
	}
}
#object-tabs {
	max-height: 70vh;
}
.info {
	display: block;
	text-align: center;
	font-style: italic;
	color: #555;
	margin-top: 0.5em;
	line-height: 1em;
}
</style>