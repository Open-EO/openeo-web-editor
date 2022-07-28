<template>
	<div class="viewerContainer" @drop="onDrop" @dragover="allowDrop">
		<Tabs id="viewerTabs" ref="tabs" @empty="onTabsEmpty">
			<template #empty>Nothing to show right now...</template>
			<template #dynamic="{ tab }">
				<LogViewer v-if="logViewerIcons.includes(tab.icon)" :data="tab.data" @mounted="onMounted" />
				<MapViewer v-else-if="tab.icon === 'fa-map'" :data="tab.data" :removableLayers="isCollectionPreview(tab.data)" @mounted="onMounted" /> <!-- for services -->
				<component v-else-if="tab.data.component" :is="tab.data.component" v-on="tab.data.events" v-bind="tab.data.props" @mounted="onMounted" /> <!-- for file formats -->
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
		this.listen('showCollectionPreview', collection => this.showCollectionPreview(collection).catch(error => Utils.exception(this, error, 'Failed loading collection.')));
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
			this.showViewer(files, title)
				.catch(error => Utils.exception(this, error))
				.finally(() => {
					// Open the log files after the data tab has been opened -> it's in finally to spawn after the data tab
					if (Array.isArray(result.logs) && result.logs.length > 0) {
						this.showLogs(result.logs, title, false);
					}
				});
		},
		showJobResults(stac, job) {
			let files = this.registry.createFilesFromSTAC(stac, job);
			if (files.length === 0) {
				Utils.error(this, 'No results available for job "' + Utils.getResourceTitle(job) + '".');
				return;
			}
			else if (files.length > 5 && !confirm(`You are about to open ${files.length} individual files / tabs, which could slow down the web browser. Are you sure you want to open all of them?`)) {
				return;
			}
			let title = Utils.getResourceTitle(job, true);
			this.showViewer(files, title, file => `${job.id}-${file.getUrl()}`, true)
				.catch(error => Utils.exception(this, error));
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
			if (!Array.isArray(files)) {
				return;
			}
			let tabId;
			for(let file of files) {
				try {
					let context = file.getContext();
					if (typeof id === 'function') {
						tabId = id(file);
					}
					else if (!id && context) {
						tabId = context.id;
					}
					else {
						tabId = id;
					}

					if (reUseExistingTab) {
						if (!tabId) {
							throw new Error("Tabs without id can't be re-used");
						}
						let tab = this.$refs.tabs.getTab(tabId);
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
					await file.loadData(this.connection);
					this.$refs.tabs.addTab(
						title, file.icon, file, tabId, true, true,
						tab => this.onShow(tab),
						tab => this.onHide(tab)
					);
				} catch (error) {
					Utils.exception(this, error, "Viewer Error");
				}
			}
		},
		callChildFunction(component, fn, ...args) {
			if (typeof component[fn] === 'function') {
				let result = component[fn](...args);
				if (result instanceof Promise) {
					result.catch(error => Utils.exception(this, error));
				}
			}
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
					await this.showCollectionPreview(id);
				} catch (error) {
					Utils.exception(this, error, `Failed loading collection '${id}'.`)
				}
			}
		},
		allowDrop(event) {
			event.preventDefault();
		},
		onShow(tab) {
			this.callChildFunction(tab, 'onShow');
		},
		onMounted(component) {
			this.callChildFunction(component, 'onShow');
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