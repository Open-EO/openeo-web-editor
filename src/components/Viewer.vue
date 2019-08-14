<template>
	<Tabs id="viewerContent" ref="tabs">
		<template #default="{ tabs }">
			<Tab id="mapView" name="Map" icon="fa-map" :selected="true">
				<template #default="{ tab }">
					<MapViewer id="mapCanvas" ref="mapViewer" :show="tab.active" />
				</template>
			</Tab>
		</template>
		<template #imageView>
			<ImageViewer ref="dataViewer" />
		</template>
		<template #dataView>
			<DataViewer ref="imageViewer" />
		</template>
	</Tabs>
</template>

<script>
import EventBus from '@openeo/vue-components/eventbus.js';
import Utils from '../utils.js';
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import Tab from '@openeo/vue-components/components/Tab.vue';
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

		window.setTimeout(() => {
			this.$refs.tabs.addTab("Images", "fa-image", null, "imageView", true);
			this.$refs.tabs.addTab("Data", "fa-database", null, "dataView");
		}, 1000);
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
		showViewer(data) {
			var type = null;
			if (data instanceof Blob) {
				type = data.type;
			}
			else {
				Utils.error(this, "Sorry, the data can't be handled.");
			}

			if (typeof type !== 'string' || type.indexOf('/') === -1 || type.indexOf('*') !== -1) {
				Utils.error(this, "Sorry, can't detect media type.");
			}

			var mime = contentType.parse(type.toLowerCase());
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
				default:
					Utils.error(this, "Sorry, the content type is not supported.");
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