<template>
	<div id="dataViewer">
		<div class="text" v-if="isText()">{{ nl2br(content) }}</div>
		<ObjectTree class="tree" v-else-if="content" :data="content"></ObjectTree>
		<div ref="emptyMsg" class="noDataMessage" v-else>Nothing to show.</div>
	</div>
</template>

<script>
import EventBus from '@openeo/vue-components/eventbus.js';
import ObjectTree from '@openeo/vue-components/components/ObjectTree.vue';
import Utils from '../utils.js';

export default {
	name: 'DataViewer',
	components:  {
		ObjectTree
	},
	data() {
		return {
			content: null
		};
	},
	mounted() {
		this.reset();
	},
	methods: {

		isText() {
			return (typeof this.content === 'string');
		},

		reset() {
			this.content = null;
		},

		showJson(data) {
			this.content = data;
		},

		showText(data) {
			this.content = data;
		},

		showBlob(blob, mimeType = null) {
			if (mimeType == null) {
				mimeType = blob.type;
			}
			switch(mimeType) {
				case 'application/json':
					Utils.blobToText(blob, (event) => {
						var json = JSON.parse(event.target.result);
						this.showJson(json);
					});
					break;
				case 'text/plain':
					Utils.blobToText(blob, (event) => {
						this.showText(event.target.result);
					});
					break;
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