<template>
	<div id="dataViewer" ref="data"></div>
</template>

<script>
import EventBus from '../eventbus.js';

export default {
	name: 'DataViewer',

	mounted() {
		this.reset();
	},

	methods: {

		reset() {
			this.$refs.data.innerText = 'Nothing to show.';
		},

		showJson(data) {
			this.$refs.data.innerHTML = this.$utils.makeList(data);
			EventBus.$emit('showDataViewer');
		},

		showText(data) {
			this.$refs.data.innerText = this.nl2br(data);
			EventBus.$emit('showDataViewer');
		},

		showBlob(blob) {
			switch(blob.type) {
				case 'application/json':
					this.blobToText(blob, (event) => {
						var json = JSON.parse(event.target.result);
						this.showJson(json);
					});
					break;
				case 'text/plain':
					this.blobToText(blob, (event) => {
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
		},

		blobToText(blob, callback) {
			var reader = new FileReader();
			reader.onload = callback;
			reader.readAsText(blob);
		}

	}
};
</script>

<style scoped>
#dataViewer {
	padding: 5px;
}
</style>