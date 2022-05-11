<template>
	<div class="viewerContainer" @drop="onDrop" @dragover="allowDrop">
		<Tabs id="viewerTabs" ref="tabs" @empty="onTabsEmpty">
			<template #empty>Nothing to show right now...</template>
			<template #dynamic="{ tab }">
				<LogViewer v-if="logViewerIcons.includes(tab.icon)" :data="tab.data" />
				<MapViewer v-else-if="tab.icon === 'fa-map'" :data="tab.data" :removableLayers="isCollectionPreview(tab.data)" @show="onShow" @hide="onHide" /> <!-- for services -->
				<component v-else-if="tab.data.component" :is="tab.data.component" v-on="tab.data.events" v-bind="tab.data.props" @show="onShow" @hide="onHide" /> <!-- for file formats -->
				<div class="unsupported" v-else>
					Sorry, the viewer doesn't support showing this type of data.
					<template v-if="isFormat(tab.data)">
						Instead, you can download the data by clicking the link below.<br />
						<a :href="tab.data.getUrl()" download>Download</a>
					</template>
				</div>
			</template>
		</Tabs>
	</div>
</template>

<script>
import EventBusMixin from './EventBusMixin.vue';
import Utils from '../utils.js';
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import { Service } from '@openeo/js-client';
import FormatRegistry from '../formats/formatRegistry';
import { Format } from '../formats/format';

export default {
	name: 'Viewer',
	mixins: [EventBusMixin],
	components: {
		Tabs,
		DataViewer: () => import('./viewer/DataViewer.vue'),
		TableViewer: () => import('./viewer/TableViewer.vue'),
		ImageViewer: () => import('./viewer/ImageViewer.vue'),
		LogViewer: () => import('./viewer/LogViewer.vue'),
		MapViewer: () => import('./viewer/MapViewer.vue')
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
			registry: new FormatRegistry(),
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
		isCollectionPreview(data) {
			return (data instanceof Service && Utils.isObject(data.attributes) && data.attributes.preview === true);
		},
		isFormat(data) {
			return (data instanceof Format);
		},
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
				preview: true,
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

			let title = Utils.getResourceTitle(collection, true);
			this.showMapViewer(service, service.id, title, true);
		},
		showWebService(service) {
			this.showMapViewer(service, service.id, null, true);
		},
		showLogs(resource, defaultTitle = 'Logs', selectTab = true, faIcon = 'fa-bug') {
			let title = Array.isArray(resource) ? defaultTitle : Utils.getResourceTitle(resource, "Logs");
			let id = Array.isArray(resource) ? null : `logs~${resource.id}`;

			if (id) { // Re-use existing tab
				let tab = this.$refs.tabs.getTab(id);
				if (tab) {
					this.$refs.tabs.selectTab(tab);
					return;
				}
			}

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
		showSyncResults(result) {
			let title = this.makeTitle("Result");
			// result.data should always be a blob
			let files = this.registry.createFilesFromBlob(result.data);
			// Download files to disc so that nothing gets lost
			files.forEach(file => file.download());
			// Show the data in the viewer
			this.showViewer(files, title).finally(() => {
				// Open the log files after the data tab has been opened -> it's in finally to spawn after the data tab
				if (Array.isArray(result.logs) && result.logs.length > 0) {
					this.showLogs(result.logs, title, false);
				}
			});
		},
		showJobResults(stac, job) {
			let files = this.registry.createFilesFromSTAC(stac, job);
			let title = Utils.getResourceTitle(job, true);
			this.showViewer(files, title, job.id, true);
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
		async showViewer(files, title = null, id = null, reUseExistingTab = false) {
			for(let file of files) {
				try {
					let context = file.getContext();
					if (!id && context) {
						id = context.id;
					}

					if (reUseExistingTab) {
						if (!id) {
							throw new Error("Tabs without id can't be re-used");
						}
						let tab = this.$refs.tabs.getTab(id);
						if (tab) {
							this.$refs.tabs.selectTab(tab);
							return;
						}
					}

					if (!title && context) {
						title = Utils.getResourceTitle(context, true);
					}
					else if (!title) {
						title = this.makeTitle("Untitled");
					}
					await file.getData(this.connection);
					this.$refs.tabs.addTab(
						title, file.icon, file, id, true, true,
						tab => this.onShow(tab),
						tab => this.onHide(tab)
					);
				} catch (error) {
					Utils.exception(this, error, "Viewer Error");
				}
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
.map-viewer, .viewerContainer {
	height: 100%;
}
.viewerContainer {
	.unsupported {
		padding: 1em;
	}
	.tabsEmpty {
		height: 100%;
		padding: 1rem;
		margin: auto;
	}
}
</style>