<template>
	<Tabs id="viewerContent" ref="tabs">
		<template #default>
			<Tab id="mapView" name="Map" icon="fa-map" :selected="true" @show="onShow" @hide="onHide">
				<template #default="{ tab }">
					<MapViewer id="mapCanvas" ref="mapViewer" :show="tab.active" :center="[50.1725, 9.15]" :zoom="6" :removableLayers="true" @drop="onDrop($event)" />
				</template>
			</Tab>
		</template>
		<template #dynamic="{ tab }">
			<LogViewer v-if="logViewerIcons.includes(tab.icon)" :data="tab.data" />
			<ImageViewer v-else-if="tab.icon === 'fa-image'" :data="tab.data" />
			<DataViewer v-else :data="tab.data" />
		</template>
	</Tabs>
</template>

<script>
import EventBusMixin from './EventBusMixin.vue';
import Utils from '../utils.js';
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import Tab from '@openeo/vue-components/components/Tab.vue';
import DataViewer from './DataViewer.vue';
import ImageViewer from './ImageViewer.vue';
import LogViewer from './LogViewer.vue';
import MapViewer from './MapViewer.vue'
import contentType from 'content-type';
import { OpenEO } from '@openeo/js-client';
export default {
	name: 'Viewer',
	mixins: [EventBusMixin],
	components: {
		Tab,
		Tabs,
		DataViewer,
		ImageViewer,
		LogViewer,
		MapViewer
	},
	mounted() {
		this.listen('viewBlob', this.showViewer);
		this.listen('viewLink', this.showViewer);

		this.listen('viewSyncResult', this.showSyncResults);
		this.listen('viewJobResults', this.showJobResults);
		this.listen('viewWebService', this.showWebService);
		this.listen('viewLogs', this.showLogs);
		this.listen('removeWebService', this.removeWebService);

		this.listen('showCollectionPreview', this.showCollectionPreview);
	},
	data() {
		return {
			tabCounter: {},
			mapActive: false,
			logViewerIcons: [
				'fa-bug',
				'fa-bomb',
				'fa-tasks'
			]
		}
	},
	computed: {
		...Utils.mapState(['connection'])
	},
	methods: {
		...Utils.mapActions(['describeCollection']),
		async showCollectionPreview(collection) {
			if (typeof collection === 'string') {
				try {
					collection = await this.describeCollection(collection);
				} catch (error) {
					Utils.error(this, "Sorry, can't load collection '" + collection + "'.");
					return;
				}
			}
			this.showMapViewer();
			await this.$refs.mapViewer.addCollection(collection);
		},
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
		showSyncResults(result) {
			if (Array.isArray(result.logs) && result.logs.length > 0) {
				this.showLogs(result.logs);
			}
			this.showViewer(result.data);
		},
		showJobResults(item, job) {
			for(var key in item.assets) {
				var asset = item.assets[key];
				let jobTitle = Utils.getResourceTitle(job, true);
				this.showViewer(asset, this.makeTitle(jobTitle, asset.title, true));
			}
		},
		showLogs(resource, defaultTitle = 'Logs', faIcon = 'fa-bug') {
			let title = Array.isArray(resource) ? defaultTitle : Utils.getResourceTitle(resource, true);
			this.$refs.tabs.addTab(
				title, faIcon, resource, null, true, true,
				tab => this.onShow(tab),
				tab => this.onHide(tab)
			);
		},
		async onDrop(event) {
			var json = event.dataTransfer.getData("application/vnd.openeo-node");
			if (!json) {
				return;
			}
			let node = JSON.parse(json);
			if (node.process_id === 'load_collection') {
				event.preventDefault();
				let id = Utils.isObject(node.arguments) ? node.arguments.id : null;
				try {
					let collection = await this.describeCollection(id);
					this.showCollectionPreview(collection);
				} catch (error) {
					Utils.error(this, "Sorry, can't load collection details for '" + id + "'.");
				}
			}
		},
		onShow(tab) {
			if (tab.$children.length && typeof tab.$children[0].onShow === 'function') {
				tab.$children[0].onShow();
			}
			else if (typeof tab.onShow === 'function') {
				tab.onShow();
			}
		},
		onHide(tab) {
			if (tab.$children.length && typeof tab.$children[0].onHide === 'function') {
				tab.$children[0].onHide();
			}
			else if (typeof tab.onHide === 'function') {
				tab.onHide();
			}
		},
		uniqueTitle(title) {
			if (!this.tabCounter[title]) {
				this.tabCounter[title] = 1;
				return title;
			}
			else {
				this.tabCounter[title]++;
				return title + " (" + this.tabCounter[title] + ")";
			}
		},
		makeTitle(title, type, inc = false) {
			if (!title) {
				return this.uniqueTitle(type);
			}
			else if (inc) {
				return this.uniqueTitle(title);
			}
			else {
				return title;
			}
		},
		async showViewer(meta, title = null) {
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

			try {
				let mime = contentType.parse(data.type);
				data.type = mime.type;
				data.parameters = mime.parameters;
			} catch (error) {}

			switch(data.type) {
				case 'image/png':
				case 'image/jpg':
				case 'image/jpeg':
				case 'image/gif':
					this.$refs.tabs.addTab(this.makeTitle(title, "Image"), "fa-image", data, null, true, true);
					break;
				case 'application/json':
				case 'text/plain':
				case 'text/csv':
					this.$refs.tabs.addTab(this.makeTitle(title, "Data"), "fa-database", data, null, true, true);
					break;
				case 'image/tiff':
					if (data.url && data.parameters.application === 'geotiff') {
						this.showMapViewer();
						await this.$refs.mapViewer.updateGeoTiffLayer(data.url, this.makeTitle(title, "GeoTiff"));
						break;
					}
					// else: Default behavior
				default:
					if (data.blob instanceof Blob) {
						OpenEO.Environment.saveToFile(data.blob, Utils.makeFileName("result", data.type));
						break;
					}
					else if (data.url) {
						try {
							let response = await this.connection._get(data.url, "", "blob");
							let filename = Utils.getFileNameFromURL(data.url);
							if (response.data instanceof Blob) {
								OpenEO.Environment.saveToFile(response.data, Utils.makeFileName(filename, data.type));
								break;
							}
						} catch (error) {
							console.error(error);
						}
					}
					Utils.error(this, 'Sorry, content type not supported by the viewer and can\'t be downloaded.');
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