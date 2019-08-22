<template>
	<Tabs id="viewerContent" ref="tabs">
		<template #default="{ tabs }">
			<Tab id="mapView" name="Map" icon="fa-map" :selected="true">
				<template #default="{ tab }">
					<MapViewer id="mapCanvas" ref="mapViewer" :show="tab.active" />
				</template>
			</Tab>
		</template>
		<template #dynamic="{ tab }">
			<ImageViewer v-if="tab.icon === 'fa-image'" :data="tab.data" />
			<DataViewer v-else :data="tab.data" />
		</template>
	</Tabs>
</template>

<script>
import EventBusMixin from './EventBuxMixin.vue';
import Utils from '../utils.js';
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import Tab from '@openeo/vue-components/components/Tab.vue';
import DataViewer from './DataViewer.vue';
import ImageViewer from './ImageViewer.vue';
import MapViewer from './MapViewer.vue'
import contentType from 'content-type';

export default {
	name: 'Viewer',
	mixins: [EventBusMixin],
	components: {
		Tab,
		Tabs,
		DataViewer,
		ImageViewer,
		MapViewer
	},
	mounted() {
		this.listen('viewBlob', this.showViewer);
		this.listen('viewLink', this.showViewer);

		this.listen('viewSyncResult', this.showSyncResults);
		this.listen('viewJobResults', this.showJobResults);
		this.listen('viewWebService', this.showWebService);
		this.listen('removeWebService', this.removeWebService);
	},
	data() {
		return {
			tabCounter: {},
		}
	},
	computed: {
		...Utils.mapState('server', ['connection'])
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
		showSyncResults(pg) {
			this.connection.computeResult(pg)
				.then(data => this.showViewer(data))
				.catch(error => Utils.exception(this, error, 'Computation failed'));
		},
		showJobResults(result, job) {
			for(var i in result.links) {
				var id = result.id || job.id;
				this.showViewer(result.links[i], this.makeTitle(result.title || job.title, "Job " + id.substr(0, 6) + "...", true));
			}
		},
		uniqueTitle(title) {
			if (!this.tabCounter[title]) {
				this.tabCounter[title] = 1;
			}
			else {
				this.tabCounter[title]++;
			}
			return title + " (" + this.tabCounter[title] + ")";
		},
		makeTitle(title, type, inc = false) {
			if (title === null) {
				return this.uniqueTitle(type);
			}
			else if (inc) {
				return this.uniqueTitle(title);
			}
			else {
				return title;
			}
		},
		showViewer(meta, title = null) {
			var data = {};
			if (Utils.isObject(meta) && typeof meta.href === 'string' && typeof meta.type === 'string') {
				data.type = meta.type;
				data.url = meta.href;
			}
			else if (meta instanceof Blob) {
				data.type = meta.type;
				data.blob = meta;
			}
			else {
				Utils.error(this, "Sorry, invalid data received.");
			}

			if (typeof data.type !== 'string' || data.type.indexOf('/') === -1 || data.type.indexOf('*') !== -1) {
				Utils.error(this, "Sorry, can't detect content type.");
			}

			Object.assign(data, contentType.parse(data.type));
			switch(data.type) {
				case 'image/png':
				case 'image/jpg':
				case 'image/jpeg':
				case 'image/gif':
					this.$refs.tabs.addTab(this.makeTitle(title, "Image"), "fa-image", data, null, true, true);
					break;
				case 'image/tiff':
					if (data.url && data.parameters.application === 'geotiff') {
						this.showMapViewer();
						this.$refs.mapViewer.updateGeoTiffLayer(data.url, this.makeTitle(title, "GeoTiff"));
					}
					else {
						Utils.error(this, 'Sorry, TIFF as blob not supported by the viewer.');
					}
					break;
				case 'application/json':
				case 'text/plain':
				case 'text/html':
					this.$refs.tabs.addTab(this.makeTitle(title, "Data"), "fa-database", data, null, true, true);
					break;
				default:
					Utils.error(this, 'Sorry, content type not supported by the viewer.');
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