<template>
	<div id="dataViewer">
		<div class="text" v-if="typeof content === 'string'">{{ content }}</div>
		<ObjectTree class="tree" v-else-if="content !== null" :data="content"></ObjectTree>
		<div ref="emptyMsg" class="noDataMessage" v-else>Nothing to show.</div>
	</div>
</template>

<script>
import ObjectTree from '@openeo/vue-components/components/ObjectTree.vue';
import Utils from '../utils.js';

export default {
	name: 'DataViewer',
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
		...Utils.mapState('server', ['connection'])
	},
	data() {
		return {
			content: null
		};
	},
	watch: {
		data() {
			this.processData();
		}
	},
	created() {
		this.processData();
	},
	methods: {
		processData() {
			if (this.data.blob) {
				switch(this.data.type) {
					case 'application/json':
						Utils.blobToText(this.data.blob, event => {
							var json = JSON.parse(event.target.result);
							this.content = json;
						});
						break;
					case 'text/plain':
						Utils.blobToText(blob, event => {
							this.content = nl2br(event.target.result);
						});
						break;
					case 'text/html':
						Utils.blobToText(blob, event => {
							this.content = event.target.result;
						});
						break;
					default:
						Utils.error(this, "Sorry, content type not supported by the data viewer.");
				}
			}
			else if (this.data.url) {
				this.connection.download(this.data.url, false)
					.then(response => this.emit('showViewer', response.data, this.data.type))
					.catch(error => Utils.exception(this, error, "Sorry, can't download file."));
			}
			else {
					Utils.error(this, 'Sorry, internal data format not supported by the viewer.');
			}
		},
		nl2br (str) {
			if (typeof str === 'undefined' || str === null) {
				return '';
			}
			return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
		}

	}
};
</script>

<style scoped>
#dataViewer .text, #dataViewer .tree {
	padding: 5px;
}
</style>