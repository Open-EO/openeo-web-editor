<template>
	<div class="dataViewer">
		<div class="noDataMessage" v-if="isError">{{ content.message }}</div>
		<pre class="text" v-else-if="typeof content === 'string'">{{ content }}</pre>
		<ObjectTree class="tree" v-else-if="content !== null" :data="content"></ObjectTree>
		<div class="noDataMessage" v-else><i class="fas fa-spinner fa-spin"></i> Loading data...</div>
	</div>
</template>

<script>
import EventBusMixin from './EventBusMixin.vue';
import ObjectTree from '@openeo/vue-components/components/ObjectTree.vue';
import Utils from '../utils.js';

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
		ObjectTree
	},
	computed: {
		...Utils.mapState(['connection']),
		isError() {
			return (this.content instanceof Error);
		}
	},
	data() {
		return {
			content: null
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
		processData(data) {
			if (typeof data.blob !== 'undefined') {
				switch(data.type) {
					case 'application/json':
						Utils.blobToText(data, event => {
							var json = JSON.parse(event.target.result);
							this.content = json;
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
			else if (data.url) {
				this.connection.download(data.url, false)
					.then(response => this.processData(response.data))
					.catch(error => Utils.exception(this, error, "Download File Error"));
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
.dataViewer .text, .dataViewer .tree {
	padding: 5px;
}
</style>
