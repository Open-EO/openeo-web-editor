<template>
	<div class="dataViewer">
		<div class="message error" v-if="isError">
			<i class="fas fa-exclamation-circle"></i>
			<span>
				Sorry, the Editor was unable to read the data.<br /><br />The following error occured:<br />
				<em>{{ content.message }}</em>
			</span>
		</div>
		<pre class="text" v-else-if="typeof content === 'string'">{{ content }}</pre>
		<Tabs v-else-if="content !== null" :id="tabsId" position="bottom">
			<Tab id="visual" name="Visual" icon="fa-list" :selected="true">
				<ObjectTree class="tree" :data="content" />
			</Tab>
			<Tab id="source" name="Code" icon="fa-code" @show="showCode">
				<TextEditor class="textEditorTab" ref="sourceEditor" :editable="false" :value="content" :id="tabsId + '_text'" :language="codeLanguage" />
			</Tab>
		</Tabs>
		<div class="noDataMessage" v-else><i class="fas fa-spinner fa-spin"></i> Loading data...</div>
	</div>
</template>

<script>
import EventBusMixin from './EventBusMixin.vue';
import ObjectTree from '@openeo/vue-components/components/ObjectTree.vue';
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import Tab from '@openeo/vue-components/components/Tab.vue';
import TextEditor from './TextEditor.vue';
import Utils from '../utils.js';
import { OpenEO } from '@openeo/js-client';

export default {
	name: 'DataViewer',
	mixins: [EventBusMixin],
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
		...Utils.mapState(['connection']),
		isError() {
			return (this.content instanceof Error);
		}
	},
	data() {
		return {
			content: null,
			tabsId: "data_viewer_" + Date.now(),
			codeLanguage: null
		};
	},
	watch: {
		data() {
			this.processData(this.data);
		}
	},
	created() {
		this.processData(this.data);
	},
	methods: {
		showCode() {
			this.$refs.sourceEditor.updateState();
		},
		async processData(data) {
			if (Utils.isObject(data) && typeof data.blob !== 'undefined') {
				switch(data.type) {
					case 'application/json':
						Utils.blobToText(data, event => {
							try {
								var json = JSON.parse(event.target.result);
								this.content = json;
								this.codeLanguage = 'json';
							} catch (error) {
								this.content = error;
							}
						});
						break;
					case 'text/plain':
					case 'text/csv':
						Utils.blobToText(data, event => {
							this.content = event.target.result;
						});
						break;
					default:
						// Should not happen if the media types here and in the viewer are aligned
						OpenEO.Environment.saveToFile(data, Utils.makeFileName("result", data.type));
						this.error("Sorry, content type not supported. Trying to download the file...");
				}
			}
			else if (Utils.isObject(data) && data.url) {
				try {
					let response = await this.connection.download(data.url, false);
					this.processData({
						blob: response,
						type: data.type || blob.type
					});
				} catch(error) {
					Utils.exception(this, error, "Download File Error");
				}
			}
			else {
				// Could also be JSON
				this.content = data;
			}
		},
		error(msg) {
			this.content = new Error(msg);
		}
	}
};
</script>

<style scoped>
.dataViewer {
	width: 100%;
	height: 100%;
}
.dataViewer .message {
	margin: 1em;
}
.dataViewer .text, .dataViewer .tree {
	padding: 5px;
}
.dataViewer .tabs.boxed {
	border: 0;
}
</style>
