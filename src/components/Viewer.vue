<template>
	<Tabs id="viewerContent" ref="tabs">
		<Tab id="mapView" name="Map" icon="fa-map" :selected="true">
			<template v-slot:tab="{ tab }">
				<MapViewer id="mapCanvas" ref="mapViewer" :show="tab.active" />
			</template>
		</Tab>
		<Tab id="imageView" name="Images" icon="fa-image">
			<template v-slot:tab>
				<ImageViewer ref="imageViewer" />
			</template>
		</Tab>
		<Tab id="dataView" name="Data" icon="fa-database">
			<template v-slot:tab>
				<DataViewer ref="dataViewer" />
			</template>
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
import contentType from 'content-type';

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
		EventBus.$on('showViewer', this.showViewer);

		EventBus.$on('showWebService', this.showWebService);
		EventBus.$on('removeWebService', this.removeWebService);
	},
	methods: {
		showWebService(service) {
			this.showMapViewer();
			this.$refs.mapViewer.showWebService(service);
		},
		removeWebService(id) {
			this.$refs.mapViewer.removeLayerFromMap(id);
		},
		showMapViewer() {
			this.$refs.tabs.selectTab('mapView');
		},
		showImageViewer() {
			this.$refs.tabs.selectTab('imageView');
		},
		showDataViewer() {
			this.$refs.tabs.selectTab('dataView');
		},
		showViewer(blob, originalOutputFormat = null) {
			if (!(blob instanceof Blob)) {
				throw 'No blob specified.';
			}
			var mimeType = blob.type;
			// Try to detect invalid mime types
			if (originalOutputFormat !== null && (!mimeType || mimeType.indexOf('/') === -1 || mimeType.indexOf('*') !== -1)) {
				mimeType = Utils.getMimeTypeForOutputFormat(originalOutputFormat);
			}
			if (typeof mimeType !== 'string') {
				Utils.error(this, "Sorry, can't detect media type.");
			}

			var mime = contentType.parse(mimeType.toLowerCase());
			switch(mime.type) {
				case 'image/png':
				case 'image/jpg':
				case 'image/jpeg':
				case 'image/gif':
					this.showImageViewer();
					this.$refs.imageViewer.showImageBlob(blob);
					break;
				case 'application/json':
				case 'text/plain':
					this.showDataViewer();
					this.$refs.dataViewer.showBlob(blob, mimeType);
					break;
				case 'image/tiff':
//					if (mime.parameters['application'] === 'geotiff') {
						this.showMapViewer();
						this.$refs.mapViewer.showGeoTiffBlob(blob);
						break;
//					}
				default:
					Utils.error(this, "Sorry, the returned content type is not supported to view.");
			}
		}
	}
}
</script>

<style>
#mapCanvas {
	height: 100%;
}
</style>