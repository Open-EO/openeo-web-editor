<template>
	<Tabs id="viewerContent" ref="tabs">
		<Tab id="mapView" name="Map" icon="fa-map" :selected="true">
			<MapViewer ref="mapViewer" />
		</Tab>
		<Tab id="imageView" name="Images" icon="fa-image">
			<ImageViewer ref="imageViewer" />
		</Tab>
		<Tab id="dataView" name="Data" icon="fa-database">
			<DataViewer ref="dataViewer" />
		</Tab>
	</tabs>
</template>

<script>
import EventBus from '../eventbus.js';
import Utils from '../utils.js';
import Tabs from './Tabs.vue';
import Tab from './Tab.vue';
import DataViewer from './DataViewer.vue';
import ImageViewer from './ImageViewer.vue';
import MapViewer from './MapViewer.vue'

export default {
	name: 'Viewer',
	components: {
		Tab,
		Tabs,
		DataViewer,
		ImageViewer,
		MapViewer
	},
	mounted() {
		EventBus.$on('showInViewer', this.showInViewer);
		EventBus.$on('showMapViewer', this.showMapViewer);
		EventBus.$on('showImageViewer', this.showImageViewer);
		EventBus.$on('showDataViewer', this.showDataViewer);
	},
	methods: {
		showMapViewer() {
			this.$refs.tabs.selectTab('mapView');
		},

		showImageViewer() {
			this.$refs.tabs.selectTab('imageView');
		},

		showDataViewer() {
			this.$refs.tabs.selectTab('dataView');
		},

		showInViewer(blob, originalOutputFormat = null) {
			if (!(blob instanceof Blob)) {
				throw 'No blob specified.';
			}
			var mimeType = blob.type;
			// Try to detect invalid mime types
			if (originalOutputFormat !== null && (!mimeType || mimeType.indexOf('/') === -1 || mimeType.indexOf('*') !== -1)) {
				mimeType = Utils.getMimeTypeForOutputFormat(originalOutputFormat);
			}
			if (typeof mimeType === 'string') {
				mimeType = mimeType.toLowerCase();
			}
			switch(mimeType) {
				case 'image/png':
				case 'image/jpg':
				case 'image/jpeg':
				case 'image/gif':
					this.$refs.imageViewer.showImageBlob(blob);
					break;
				case 'application/json':
				case 'text/plain':
					this.$refs.dataViewer.showBlob(blob, mimeType);
					break;
				case 'image/tif':
				case 'image/tiff':
					this.$refs.mapViewer.showGTiffBlob(blob);
					break;
				default:
					Utils.error(this, "Sorry, the returned content type is not supported to view.");
			}
		}
	}
}
</script>