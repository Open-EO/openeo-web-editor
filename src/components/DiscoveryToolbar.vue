<template>
	<div class="discovery-toolbar">
		<SearchBox v-model="searchTerm" />
		<div class="search-results">
			<Collections class="category" :collections="collections" :searchTerm="searchTerm" :offerDetails="false" :collapsed="collapsed">
				<template #summary="{ item }">
					<div class="discovery-entity" :draggable="supportsLoadCollection" @dragstart="onDrag($event, 'collection', item)">
						<div class="discovery-info" @click="showCollectionInfo(item.id)">
							<strong :title="item.id">{{ item.id }}</strong>
							<small v-if="item.title" :title="item.title">{{ item.title }}</small>
						</div>
						<button v-if="hasCollectionPreview(item)" class="discovery-button" type="button" @click="showCollectionPreview(item)" title="View on map"><i class="fas fa-map"></i></button>
					</div>
				</template>
			</Collections>

			<Processes class="category" :processes="allProcesses" :searchTerm="searchTerm" :offerDetails="false" :collapsed="collapsed">
				<template #summary="{ item }">
					<div class="discovery-entity" draggable="true" @dragstart="onDrag($event, 'process', item)">
						<div class="discovery-info" @click="showProcess(item)">
							<i v-if="item.namespace === 'user'" class="custom-process fas fa-xs fa-sitemap" title="Custom Process"></i>
							<i v-else-if="item.namespace !== 'backend'" class="custom-process fas fa-xs fa-tag" :title="`Process from namespace '${item.namespace}'`"></i>
							<strong :title="item.id">{{ item.id }}</strong>
							<small v-if="item.summary" :title="item.summary">{{ item.summary }}</small>
						</div>
					</div>
				</template>
			</Processes>

			<UdfRuntimes v-if="hasUdfRuntimes" class="category" :runtimes="udfRuntimes" :searchTerm="searchTerm" :offerDetails="false" :collapsed="collapsed">
				<template #summary="{ summary, item }">
					<div class="discovery-entity" :draggable="supportsRunUdf" @dragstart="onDrag($event, 'udf', {runtime: summary.identifier, version: item.default})">
						<div class="discovery-info" @click="showUdfInfo(summary.identifier, item)">
							<strong :title="summary.identifier">{{ summary.identifier }} ({{ item.default }})</strong>
							<small v-if="summary.summary" :title="summary.summary">{{ summary.summary }}</small>
						</div>
					</div>
				</template>
			</UdfRuntimes>

			<FileFormats class="category" :formats="fileFormats" :showInput="false" heading="Export File Formats" :searchTerm="searchTerm" :offerDetails="false" :collapsed="collapsed">
				<template #summary="{ item }">
					<div class="discovery-entity" :draggable="supportsSaveResult" @dragstart="onDrag($event, 'fileformat', item)">
						<div class="discovery-info" @click="showFileFormatInfo(item)">
							<strong :title="item.name">{{ item.name }}</strong>
							<small v-if="item.title" :title="item.title">{{ item.title }}</small>
						</div>
					</div>
				</template>
			</FileFormats>
		</div>
	</div>
</template>

<script>
import EventBusMixin from './EventBusMixin.vue';
import Utils from '../utils.js';
import Collections from '@openeo/vue-components/components/Collections.vue';
import FileFormats from '@openeo/vue-components/components/FileFormats.vue';
import Processes from '@openeo/vue-components/components/Processes.vue';
import SearchBox from '@openeo/vue-components/components/SearchBox.vue';
import UdfRuntimes from '@openeo/vue-components/components/UdfRuntimes.vue';

export default {
	name: 'DiscoveryToolbar',
	mixins: [EventBusMixin],
	components: {
		Collections,
		FileFormats,
		Processes,
		SearchBox,
		UdfRuntimes
	},
	props: {
		onAddProcess: {
			type: Function,
			required: true
		},
		collectionPreview: {
			type: Boolean,
			default: false
		},
		persist: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			internalSearchTerm: '',
			collapsed: true
		};
	},
	computed: {
		...Utils.mapState(['collections', 'udfRuntimes']),
		...Utils.mapState('editor', ['discoverySearchTerm']),
		...Utils.mapGetters(['supports', 'collectionDefaults', 'fileFormats', 'processes']),
		supportsLoadCollection() {
			return this.processes.has('load_collection');
		},
		supportsRunUdf() {
			return this.processes.has('run_udf');
		},
		supportsSaveResult() {
			return this.processes.has('save_result');
		},
		hasUdfRuntimes() {
			return Utils.size(this.udfRuntimes);
		},
		allProcesses() {
			return this.processes.all();
		},
		searchTerm: {
			get() {
				if (this.persist) {
					return this.discoverySearchTerm;
				}
				else {
					return this.internalSearchTerm;
				}
			},
			set(newValue) {
				if (this.persist) {
					this.setDiscoverySearchTerm(newValue);
				}
				else {
					this.internalSearchTerm = newValue;
				}
			}
		}
	},
	watch: {
		searchTerm: {
			immediate: true,
			handler(newVal, oldVal) {
				if (!newVal && oldVal) {
					this.collapsed = true;
				}
				else if (newVal && !oldVal) {
					this.collapsed = false;
				}
			}
		}
	},
	methods: {
		...Utils.mapMutations('editor', ['setDiscoverySearchTerm']),
		onDrag(event, type, data) {
			let node = this.getNode(type, data);
			event.dataTransfer.setData("application/vnd.openeo-node", JSON.stringify(node));
			event.dataTransfer.setData("text/plain", JSON.stringify(node, null, 2));
		},
		showCollectionInfo(id) {
			this.emit('showCollection', id);
		},
		hasCollectionPreview(collection) {
			return Boolean(this.collectionPreview && Utils.getPreviewLinkFromSTAC(collection));
		},
		showCollectionPreview(collection) {
			this.emit('showCollectionPreview', collection);
		},
		showProcess(process) {
			this.emit('showProcess', process);
		},
		showUdfInfo(id, data) {
			this.emit('showModal', 'UdfRuntimeModal', {id, data, version: data.default});
		},
		showFileFormatInfo(format) {
			let props = {
				id: format.name,
				format: this.fileFormats.output[format.name],
				type: "output"
			};
			this.emit('showModal', 'FileFormatModal', props);
		},
		getNode(type, data) {
			switch(type) {
				case 'collection':
					return {
						process_id: 'load_collection',
						arguments: this.collectionDefaults(data.id)
					};
				case 'process':
					return {
						process_id: data.id,
						namespace: data.namespace,
						arguments: {}
					};
				case 'udf':
					return {
						process_id: 'run_udf',
						arguments: data
					};
				case 'fileformat':
					return {
						process_id: 'save_result',
						arguments: {format: data.name, options: {}}
					};
			}
		}
	}
}
</script>

<style>
.search-results h2.heading {
	font-size: 1em;
	border: 0;
	margin: 0;
	padding: 0;
	margin-bottom: 0.5em;
}
.search-results .vue-component.searchable-list ul.list > li > summary:before {
	content: '';
	margin-left: 0;
	float: none;
}
.search-results .vue-component.searchable-list ul.list > li > summary {
	margin: 0;
	line-height: inherit;
}
.search-results .vue-component.searchable-list ul.list > li {
	margin-bottom: 0;
}
</style>

<style lang="scss" scoped>
@import '../../theme.scss';

.discovery-toolbar {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	overflow: hidden; /* to hide .search-box .icon */
}

.search-results {
	overflow-y: auto;
	flex-grow: 1;
}

.category {
	padding: 5px;
}
.category strong {
	cursor: pointer;
	overflow: hidden;
	white-space: nowrap;
}

.discovery-entity {
	display: flex;
	margin: 0.25em 0;
	border: 1px solid #ddd;
	border-radius: 3px;
	cursor: pointer;
	user-select: none;
	font-size: 0.9em;

	strong {
		display: block;
		font-weight: normal;
		white-space: nowrap;
		width: 100%;
		overflow: hidden; 
		text-overflow: ellipsis;
		color: $linkColor;
	}

	small {
		margin-top: 0.25em;
		display: block;
	}

	.discovery-info {
		flex-grow: 1;
		padding: 5px;
		width: 100%;
		overflow: hidden; 
		position: relative;

		&:hover {
			background-color: #eee;

			strong {
				color: #000;
			}
		}
	}

	.discovery-button {
		display: block;
		margin: 0;
		padding: 5px;
		background-color: #fff;
		color: #aaa;
		border: 0;
		border-left: 1px solid #ddd;

		&:hover {
			background-color: #eee;
			color: #000;
		}
	}

	.custom-process {
		position: absolute;
		top: 7px;
		right: 5px;
	}
}
</style>