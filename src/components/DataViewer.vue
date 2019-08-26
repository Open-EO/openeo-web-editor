<template>
	<div class="dataViewer">
		<div class="noDataMessage" v-if="isError">{{ content.message }}</div>
		<div class="text" v-else-if="typeof content === 'string'">{{ content }}</div>
		<ObjectTree class="tree" v-else-if="content !== null" :data="content"></ObjectTree>
		<div class="noDataMessage" v-else><i class="fas fa-spinner fa-spin"></i> Loading data...</div>
	</div>
</template>

<script>
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
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
		...Utils.mapState('server', ['connection']),
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
			if (data instanceof Blob) {
				switch(data.type) {
					case 'application/json':
						Utils.blobToText(data, event => {
							var json = JSON.parse(event.target.result);
							this.content = json;
						});
						break;
					case 'text/plain':
						Utils.blobToText(data, event => {
							this.content = nl2br(event.target.result);
						});
						break;
					case 'text/html':
						Utils.blobToText(data, event => {
							this.content = event.target.result;
						});
						break;
					default:
						this.error("Sorry, content type not supported.");
				}
			}
			else if (data.url) {
				this.connection.download(data.url, false)
					.then(response => this.processData(response.data))
					.catch(error => Utils.exception(this, error, "Sorry, can't download file."));
			}
			else {
				this.error('Sorry, internal data format not supported.');
			}
		},
		nl2br (str) {
			if (typeof str === 'undefined' || str === null) {
				return '';
			}
			return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
		},
		error(msg) {
			this.content = new Error(msg);
//			Utils.error(this, msg);
		}
	}
};
</script>

<style scoped>
.dataViewer .text, .dataViewer .tree {
	padding: 5px;
}
</style>
