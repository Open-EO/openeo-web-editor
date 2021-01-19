<template>
	<div class="discovery-toolbar">
        <div class="search-box">
            <span class="icon">🔎</span>
            <input type="search" v-model="searchTerm" placeholder="Search" title="Search in collections and processes" />
        </div>
		<div class="search-results">
			<div :class="{ category: true, collections: true, expanded: collectionsExpanded }">
				<strong @click="toggle('collections')" :title="'Collections ('+collectionsCount+')'"><span class="toggle">▸</span> Collections</strong>
				<div class="discovery-entity" v-for="(e, i) in collections" v-show="collectionsShow[i]" :key="e.id" :draggable="supportsLoadCollection" @dragstart="onDrag($event, 'collection', e)">
					<div class="discovery-info" @click="showCollectionInfo(e.id)">
						<strong :title="e.id">{{ e.id }}</strong>
						<small v-if="e.title" :title="e.title">{{ e.title }}</small>
					</div>
					<button v-if="supportsLoadCollection" class="discovery-button" type="button" @click="insertCollection(e)" title="Insert"><i class="fas fa-plus"></i></button>
				</div>
				<div class="noData" v-if="!collectionsCount && searchTerm === ''">No collections available.</div>
				<div class="noData" v-else-if="!collectionsCount">No collections found.</div>
			</div>

			<div :class="{ category: true, processes: true, expanded: processesExpanded }">
				<strong @click="toggle('processes')" :title="'Processes ('+processesCount+')'"><span class="toggle">▸</span> Processes</strong>
				<div class="discovery-entity" v-for="(e, i) in processes" v-show="processesShow[i]" :key="e.id" draggable="true" @dragstart="onDrag($event, 'process', e)">
					<div class="discovery-info" @click="showProcessInfo(e)">
						<i v-if="!e.native" class="custom-process fas fa-xs fa-sitemap" title="Custom Process"></i>
						<strong :title="e.id">{{ e.id }}</strong>
						<small v-if="e.summary" :title="e.summary">{{ e.summary }}</small>
					</div>
					<button class="discovery-button" type="button" @click="insertProcess(e)" title="Insert"><i class="fas fa-plus"></i></button>
				</div>
				<div class="noData" v-if="!processesCount && searchTerm === ''">No processes available.</div>
				<div class="noData" v-else-if="!processesCount">No processes found.</div>
			</div>

			<div v-if="udfsShow.length > 0" :class="{ category: true, udfs: true, expanded: udfsExpanded }">
				<strong @click="toggle('udfs')" :title="'UDFs ('+udfsCount+')'"><span class="toggle">▸</span> UDF Runtimes</strong>
				<div class="discovery-entity" v-for="(e, i) in udfs" v-show="udfsShow[i]" :key="e.id" :draggable="supportsRunUdf" @dragstart="onDrag($event, 'udf', e)">
					<div class="discovery-info" @click="showUdfInfo(e)">
						<strong :title="e.id">{{ e.id }} {{ e.version }}</strong>
					</div>
					<button v-if="supportsRunUdf" class="discovery-button" type="button" @click="insertUdf(e)" title="Insert"><i class="fas fa-plus"></i></button>
				</div>
				<div class="noData" v-if="!udfsCount && searchTerm !== ''">No UDF runtimes found.</div>
			</div>
		</div>
	</div>
</template>

<script>
import Config from '../../config.js';
import EventBusMixin from './EventBusMixin.vue';
import Utils from '../utils.js';
import { ProcessGraph } from '@openeo/js-client';

export default {
	name: 'DiscoveryToolbar',
	mixins: [EventBusMixin],
	props: {
		onAddProcess: {
			type: Function,
			required: true
		}
	},
	data() {
		return {
			searchTerm: '',
			collectionsExpanded: false,
			processesExpanded: false,
			udfsExpanded: false,
			collectionsShow: [],
			processesShow: [],
			udfsShow: [],
			collectionsCount: 0,
			processesCount: 0,
			udfCount: 0,
			timeout: null
		};
	},
	created() {
		this.filter('processes');
		this.filter('collections');
		this.filter('udfs');
	},
	watch: {
		processes() {
			if (!Array.isArray(this.processes)) {
				return;
			}
			this.filter('processes');
		},
		collections() {
			if (!Array.isArray(this.collections)) {
				return;
			}
			this.filter('collections');
		},
		udfRuntimes() {
			if (!Array.isArray(this.udfRuntimes)) {
				return;
			}
			this.filter('udfs');
		},
		searchTerm() {
			if (this.timeout !== null) {
				clearTimeout(this.timeout);
			}
			this.timeout = setTimeout(() => {
				this.timeout = null;
				this.filter('processes');
				this.filter('collections');
				this.filter('udfs');
			}, 500);
		}
	},
	computed: {
		...Utils.mapState(['predefinedProcesses', 'collections', 'udfRuntimes']),
		...Utils.mapState('userProcesses', ['userProcesses']),
		...Utils.mapGetters(['supports', 'collectionDefaults']),
		...Utils.mapGetters('userProcesses', {getProcessById: 'getAllById'}),
		supportsLoadCollection() {
			return this.getProcessById('load_collection');
		},
		supportsRunUdf() {
			return this.getProcessById('run_udf');
		},
		processes() {
			return this.predefinedProcesses.concat(this.userProcesses).sort(Utils.sortById);
		},
		udfs() {
			let udfs = [];
			for(let runtime in this.udfRuntimes) {
				let language = {
					id: runtime,
					title: this.udfRuntimes[runtime].title || runtime
				};
				for (let version in this.udfRuntimes[runtime].versions) {
					udfs.push(Object.assign({}, language, {version}));
				}
			}
			return udfs;
		}
	},
	methods: {
		async filterArrayAsync(arr, callback) {
			const fail = Symbol();
			return (await Promise.all(arr.map(async item => (await callback(item)) ? item : fail))).filter(i=>i!==fail);
		},
		onDrag(event, type, data) {
			let node = this.getNode(type, data);
			event.dataTransfer.setData("application/openeo-node", JSON.stringify(node));
			event.dataTransfer.setData("text/plain", JSON.stringify(node, null, 2));
		},
		filter(type) {
			var count = 0;
			var show = [];
			var expand = false;
			var term = this.searchTerm.toLowerCase();
			if (this.searchTerm) {
				show = this[type].map(e => {
					var matches = this.filterFn(e, term);
					if (matches) {
						count++;
					}
					return matches;
				});
				expand = true;
			}
			else {
				show = this[type].map(() => true);
				count = this[type].length;
			}
			this[type + 'Show'] = show;
			this[type + 'Count'] = count;
			this.toggle(type, expand);
		},
		filterFn(e, term) {
			if (e.id.toLowerCase().includes(term)) {
				return true;
			}
			if (typeof e.summary === 'string' && e.summary.toLowerCase().includes(term)) {
				return true;
			}
			if (typeof e.title === 'string' && e.title.toLowerCase().includes(term)) {
				return true;
			}
			return false;
		},
		toggle(type, expand = null) {
			var key = type + 'Expanded';
			this[key] = expand === null ? !this[key] : expand;
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

<style scoped>
.discovery-toolbar {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	overflow: hidden; /* to hide .search-box .icon */
}

.search-box {
    margin: 5px;
    position: relative;
}
.search-box input, .search-box .icon {
	height: 1.5em;
	font-size: 1em;
	margin: 0;
}

.search-box input {
    padding: 0.25em 0.3em;
    padding-left: 1.9em;
    z-index: 1;
	display: inline-block;
	box-sizing: content-box;
	background-color: #fff;
	width: calc(100% - 2.2em);
}
.search-box .icon {
    user-select: none;
    margin-top: 0.3em;
    margin-left: 0.3em;
    width: 1em;
    z-index: 2;
    position: absolute;
    top: 0;
    left: 0;
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
.category strong .toggle {
	display: inline-block;
}
.category.expanded strong .toggle {
	transform: rotate(90deg);
}
.discovery-entity, .noData {
	display: none;
}
.category.expanded .noData {
	display: block;
	margin: 0.25em 0;
}
.category.expanded .discovery-entity {
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