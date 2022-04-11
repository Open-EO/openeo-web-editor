<template>
	<div class="viewerContainer" @drop="onDrop" @dragover="allowDrop">
		<Tabs id="viewerTabs" ref="tabs" @empty="onTabsEmpty">
			<template #empty>Nothing to show right now...</template>
			<template #dynamic="{ tab }">
				<MapViewer v-if="tab.icon === 'fa-map'" class="mapCanvas" @show="onShow" @hide="onHide" :data="tab.data" :removableLayers="true" />
				<LogViewer v-else-if="logViewerIcons.includes(tab.icon)" :data="tab.data" />
				<ImageViewer v-else-if="tab.icon === 'fa-image'" :data="tab.data" />
				<DataViewer v-else :data="tab.data" />
			</template>
		</Tabs>
	</div>
</template>

<script>
import EventBusMixin from './EventBusMixin.vue';
import Utils from '../utils.js';
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import DataViewer from './DataViewer.vue';
import ImageViewer from './ImageViewer.vue';
import LogViewer from './LogViewer.vue';
import MapViewer from './MapViewer.vue'
import contentType from 'content-type';
import { OpenEO, Service } from '@openeo/js-client';

export default {
	name: 'Viewer',
	mixins: [EventBusMixin],
	components: {
		Tabs,
		DataViewer,
		ImageViewer,
		LogViewer,
		MapViewer
	},
	mounted() {
		this.listen('viewSyncResult', this.showSyncResults);
		this.listen('viewJobResults', this.showJobResults);
		this.listen('viewWebService', this.showWebService);
		this.listen('showCollectionPreview', this.showCollectionPreview);
		this.listen('viewLogs', this.showLogs);
		this.listen('removeWebService', this.closeTabWithLogs);
		this.listen('removeBatchJob', this.closeTabWithLogs);
	},
	data() {
		return {
			tabTitleCounter: {},
			tabIdCounter: 0,
			logViewerIcons: [
				'fa-bug',
				'fa-bomb',
				'fa-tasks'
			]
		}
	},
	computed: {
		...Utils.mapState(['connection', 'userLocation']),
		nextTabId() {
			return `viewer~${this.tabIdCounter}`;
		}
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

			let link = Utils.getPreviewLinkFromSTAC(collection);
			if (!link) {
				Utils.error(this, 'No visualizations found for collection');
			}

			let service = new Service(null, `collection-preview~${collection.id}`);
			service.url = link.href;
			service.type = link.rel.toLowerCase();
			service.attributes = {
				bbox: Utils.extentToBBox(collection.extent.spatial.bbox[0])
			};
			if (link.rel.toLowerCase() === 'wmts') {
				if (typeof link['wmts:layer'] === 'string') {
					service.attributes.layers = [
						link['wmts:layer']
					];
				}
				else if (Array.isArray(link['wmts:layer'])) {
					service.attributes.layers = link['wmts:layer'];
				}
				service.attributes.dimensions = link['wmts:dimensions'];
			}

			this.showMapViewer(service, service.id, Utils.getResourceTitle(collection, true), true);
		},
		showWebService(service) {
			this.showMapViewer(service, service.id);
		},
		showSyncResults(result) {
			let title = this.makeTitle("Result");
			this.showViewer(result.data, result.type, title, null, true);
			if (Array.isArray(result.logs) && result.logs.length > 0) {
				this.showLogs(result.logs, title, false);
			}
		},
		showJobResults(stac, job) {
			// ToDo: Put all GeoTiffs on a single map
			for(var key in stac.assets) {
				var asset = stac.assets[key];
				let jobTitle = Utils.getResourceTitle(job, true);
				this.showViewer(asset, asset.type, this.makeTitle(jobTitle, asset.title), job.id, false, stac);
			}
		},
		showLogs(resource, defaultTitle = 'Logs', selectTab = true, faIcon = 'fa-bug') {
			let title = Array.isArray(resource) ? defaultTitle : Utils.getResourceTitle(resource, "Logs");
			let id = Array.isArray(resource) ? null : `logs~${resource.id}`;
			this.$refs.tabs.addTab(
				title, faIcon, resource, id, selectTab, true,
				tab => this.onShow(tab),
				tab => this.onHide(tab)
			);
		},
		closeTabWithLogs(id) {
			this.closeTab(id);
			this.closeTab(`logs~${id}`);
		},
		closeTab(id) {
			let tab = this.$refs.tabs.getTab(id);
			if (tab) {
				this.$refs.tabs.closeTab(tab);
			}
		},
		showMapViewer(resource, id = null, title = null, reUseExistingTab = false) {
			if (!title) {
				title = Utils.getResourceTitle(resource, true);
			}
			if (!id) {
				id = this.nextTabId;
				this.tabIdCounter++;
				if (reUseExistingTab) {
					throw new Error("Tabs without id can't be re-used");
				}
			}
			else if (reUseExistingTab) {
				let tab = this.$refs.tabs.getTab(id);
				if (tab) {
					return this.$refs.tabs.selectTab(tab);
				}
			}
			this.$refs.tabs.addTab(
				title, "fa-map", resource, id, true, true,
				tab => this.onShow(tab),
				tab => this.onHide(tab)
			);
		},
		async showViewer(meta, type, title = null, id = null, synchronous = false, context = null) {
			var data = {};
			if (Utils.isObject(meta) && typeof meta.href === 'string') {
				Object.assign(data, meta, { url: meta.href });
			}
			else if (meta instanceof Blob) {
				data.blob = meta;
			}

			try {
				let mime = contentType.parse(type);
				data.type = mime.type;
				data.parameters = mime.parameters;
			} catch (error) {
				data.type = type;
				console.log(error);
			}

			// Try to show the file
			let shown = false;
			switch(data.type) {
				case 'image/png':
				case 'image/jpg':
				case 'image/jpeg':
				case 'image/gif':
					if (!title) {
						title = this.makeTitle("Image");
					}
					this.$refs.tabs.addTab(title, "fa-image", data, id, true, true);
					shown = true;
					break;
				case 'application/json':
				case 'text/plain':
				case 'text/csv':
					if (!title) {
						title = this.makeTitle("Data");
					}
					this.$refs.tabs.addTab(title, "fa-database", data, id, true, true);
					shown = true;
					break;
				case 'image/tiff':
					if (data.parameters.application === 'geotiff') {
						if (!title) {
							title = this.makeTitle("GeoTiff");
						}
						if (id === null && Utils.isObject(id)) {
							id = context.id;
						}
						let initTiff = async tab => await this.callChildFunction(tab, 'updateGeoTiffLayer', data, title, context);
						this.showMapViewer(context, id, initTiff, title, false);
						shown = true;
					}
					break;
			}

			if (synchronous || !shown) {
				if (data.blob instanceof Blob) {
					OpenEO.Environment.saveToFile(data.blob, Utils.makeFileName("result", data.type));
					return;
				}
				else if (data.url) {
					try {
						let response = await this.connection._get(data.url, "", "blob");
						let filename = Utils.getFileNameFromURL(data.url);
						if (response.data instanceof Blob) {
							OpenEO.Environment.saveToFile(response.data, Utils.makeFileName(filename, data.type));
							return;
						}
					} catch (error) {
						Utils.exception(this, error, "Sorry, can't load data from URL.");
						return;
					}
				}

				Utils.exception(this, 'Sorry, this type of data is not supported by the editor and can\'t be downloaded.');
			}
		},
		async callChildFunction(tab, fn, ...args) {
			let result;
			if (tab.$children.length === 1 && typeof tab.$children[0][fn] === 'function') {
				result = tab.$children[0][fn](...args);
			}
			else if (typeof tab[fn] === 'function') {
				result = tab[fn](...args);
			}
			else {
				return Promise.reject();
			}
			if (result instanceof Promise) {
				result = await result;
			}
			return result;
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
		allowDrop(event) {
			event.preventDefault();
		},
		onShow(tab) {
			this.callChildFunction(tab, 'onShow');
		},
		onHide(tab) {
			this.callChildFunction(tab, 'onHide');
		},
		onTabsEmpty(hasNone) {
			this.$emit('empty', hasNone);
		},
		uniqueTitle(title) {
			if (!this.tabTitleCounter[title]) {
				this.tabTitleCounter[title] = 1;
				return title;
			}
			else {
				this.tabTitleCounter[title]++;
				return title + " (" + this.tabTitleCounter[title] + ")";
			}
		},
		makeTitle(title, type, unique = true) {
			if (!title) {
				return this.uniqueTitle(type);
			}
			else if (unique) {
				return this.uniqueTitle(title);
			}
			else {
				return title;
			}
		}
	}
}
</script>

<style lang="scss">
.mapCanvas, .viewerContainer {
	height: 100%;
}
.viewerContainer .tabsEmpty {
	height: 100%;
	padding: 1rem;
	margin: auto;
}
</style>