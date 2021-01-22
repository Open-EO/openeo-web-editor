<template>
	<div class="discovery-toolbar">
		<SearchBox v-model="searchTerm" />
		<div class="search-results">
			<Collections class="category" :collections="collections" :searchTerm="searchTerm" :offerDetails="false" :collapsed="true">
				<template #summary="{ item }">
					<div class="discovery-entity" :draggable="supportsLoadCollection" @dragstart="onDrag($event, 'collection', item)">
						<div class="discovery-info" @click="showCollectionInfo(item.id)">
							<strong :title="item.id">{{ item.id }}</strong>
							<small v-if="item.title" :title="item.title">{{ item.title }}</small>
						</div>
						<button v-if="supportsLoadCollection" class="discovery-button" type="button" @click="insertCollection(item)" title="Insert"><i class="fas fa-plus"></i></button>
					</div>
				</template>
			</Collections>

			<Processes class="category" :processes="processes" :searchTerm="searchTerm" :offerDetails="false" :collapsed="true">
				<template #summary="{ item }">
					<div class="discovery-entity" draggable="true" @dragstart="onDrag($event, 'process', item)">
						<div class="discovery-info" @click="showProcessInfo(item)">
							<i v-if="!item.native" class="custom-process fas fa-xs fa-sitemap" title="Custom Process"></i>
							<strong :title="item.id">{{ item.id }}</strong>
							<small v-if="item.summary" :title="item.summary">{{ item.summary }}</small>
						</div>
						<button class="discovery-button" type="button" @click="insertProcess(e)" title="Insert"><i class="fas fa-plus"></i></button>
					</div>
				</template>
			</Processes>

			<UdfRuntimes class="category" :runtimes="udfRuntimes" :searchTerm="searchTerm" :offerDetails="false" :collapsed="true">
				<template #summary="{ item }">
					<div class="discovery-entity" :draggable="supportsRunUdf" @dragstart="onDrag($event, 'udf', item)">
						<div class="discovery-info" @click="showUdfInfo(item)">
							<strong :title="item.id">{{ item.id }} {{ item.version }}</strong>
						</div>
						<button v-if="supportsRunUdf" class="discovery-button" type="button" @click="insertUdf(item)" title="Insert"><i class="fas fa-plus"></i></button>
					</div>
				</template>
			</UdfRuntimes>
		</div>
	</div>
</template>

<script>
import Config from '../../config.js';
import EventBusMixin from './EventBusMixin.vue';
import Utils from '../utils.js';
import { ProcessGraph } from '@openeo/js-client';
import Collections from '@openeo/vue-components/components/Collections.vue';
import Processes from '@openeo/vue-components/components/Processes.vue';
import SearchBox from '@openeo/vue-components/components/SearchBox.vue';
import UdfRuntimes from '@openeo/vue-components/components/UdfRuntimes.vue';

export default {
	name: 'DiscoveryToolbar',
	mixins: [EventBusMixin],
	components: {
		Collections,
		Processes,
		SearchBox,
		UdfRuntimes
	},
	props: {
		onAddProcess: {
			type: Function,
			required: true
		}
	},
	data() {
		return {
			searchTerm: ''
		};
	},
	computed: {
		...Utils.mapState(['predefinedProcesses', 'collections', 'udfRuntimes']),
		...Utils.mapState('userProcesses', ['userProcesses']),
		...Utils.mapGetters(['supports', 'collectionDefaults']),
		...Utils.mapGetters('userProcesses', {getProcessById: 'getAllById'}),
		supportsLoadCollection() {
			return !!this.getProcessById('load_collection');
		},
		supportsRunUdf() {
			return !!this.getProcessById('run_udf');
		},
		processes() {
			return this.predefinedProcesses.concat(this.userProcesses);
		}
	},
	methods: {
		onDrag(event, type, data) {
			let node = this.getNode(type, data);
			event.dataTransfer.setData("application/openeo-node", JSON.stringify(node));
			event.dataTransfer.setData("text/plain", JSON.stringify(node, null, 2));
		},
		showCollectionInfo(id) {
			if (this.supports('listCollections')) {
				this.emit('showCollection', id);
			}
		},
		showProcessInfo(process) {
			this.emit('showProcessInfo', process);
		},
		showUdfInfo(runtime) {
			this.emit('showUdfRuntimeInfo', runtime.id, this.udfRuntimes[runtime.id], runtime.version);
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
						arguments: {}
					};
				case 'udf':
					return {
						process_id: 'run_udf',
						arguments: {runtime: data.id, version: data.version}
					};
			}
		},
		insertCollection(collection) {
			let node = this.getNode('collection', collection);
			this.onAddProcess(node);
		},
		insertProcess(process) {
			let node = this.getNode('process', process);
			this.onAddProcess(node);
		},
		insertUdf(udf) {
			let node = this.getNode('udf', udf);
			this.onAddProcess(node);
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

<style scoped>
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
}
.discovery-info {
	flex-grow: 1;
	padding: 5px;
	width: 100%;
	overflow: hidden; 
	position: relative;
}
.discovery-info:hover {
	background-color: #eee;
}
.discovery-entity strong {
	display: block;
	font-weight: normal;
	white-space: nowrap;
	width: 100%;
	overflow: hidden; 
	text-overflow: ellipsis;
	color: #1665B6;
}
.discovery-info:hover strong {
	color: #000;
}
.discovery-entity small {
	margin-top: 0.25em;
	display: block;
}
.discovery-button {
	display: block;
	margin: 0;
	padding: 5px;
	background-color: #fff;
	color: #aaa;
	border: 0;
	border-left: 1px solid #ddd;
}
.discovery-button:hover {
	background-color: #eee;
	color: #000;
}
.custom-process {
	position: absolute;
	top: 7px;
	right: 5px;
}
</style>