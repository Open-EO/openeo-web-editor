<template>
	<div class="discovery-toolbar">
        <div class="search-box">
            <span class="icon">🔎</span>
            <input type="search" v-model="searchTerm" placeholder="Search" title="Search in collections and processes" />
        </div>
		<div class="search-results">
			<div :class="{ category: true, collections: true, expanded: collectionsExpanded }">
				<strong @click="toggle('collections')" :title="'Collections ('+collectionsCount+')'"><span class="toggle">▸</span> Collections</strong>
				<div class="discovery-entity" v-for="(e, i) in collections" v-show="collectionsShow[i]" :key="e.id" draggable="true" @dragstart="onDrag($event, 'collection', e.id)">
					<div class="discovery-info" @click="showCollectionInfo(e.id)">
						<strong :title="e.id">{{ e.id }}</strong>
						<small v-if="e.title" :title="e.title">{{ e.title }}</small>
					</div>
					<button class="discovery-button" type="button" @click="insertCollection(e.id)" title="Insert"><i class="fas fa-plus"></i></button>
				</div>
				<div class="noData" v-if="!collectionsCount">No collections available.</div>
			</div>

			<div :class="{ category: true, processes: true, expanded: processesExpanded }">
				<strong @click="toggle('processes')" :title="'Processes ('+processesCount+')'"><span class="toggle">▸</span> Processes</strong>
				<div class="discovery-entity" v-for="(e, i) in processes" v-show="processesShow[i]" :key="e.id" draggable="true" @dragstart="onDrag($event, 'process', e.id)">
					<div class="discovery-info" @click="showProcessInfo(e.id)">
						<strong :title="e.id">{{ e.id }}</strong>
						<small v-if="e.summary" :title="e.summary">{{ e.summary }}</small>
					</div>
					<button class="discovery-button" type="button" @click="insertProcess(e.id)" title="Insert"><i class="fas fa-plus"></i></button>
				</div>
				<div class="noData" v-if="!processesCount">No processes available.</div>
			</div>
		</div>
	</div>
</template>

<script>
import Config from '../../config.js';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import ConnectionMixin from './ConnectionMixin.vue';
import Utils from '../utils.js';

export default {
	name: 'DiscoveryToolbar',
	mixins: [ConnectionMixin, EventBusMixin],
	props: {
		onAddCollection: {
			type: Function,
			required: true
		},
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
			collectionsShow: [],
			processesShow: [],
			collectionsCount: 0,
			processesCount: 0,
			timeout: null
		};
	},
	created() {
		this.filter('processes');
		this.filter('collections');
	},
	watch: {
		processes() {
			if (typeof this.processes !== 'object') {
				return;
			}
			this.filter('processes');
		},
		collections() {
			if (typeof this.collections !== 'object') {
				return;
			}
			this.filter('collections');
		},
		searchTerm() {
			if (this.timeout !== null) {
				clearTimeout(this.timeout);
			}
			this.timeout = setTimeout(() => {
				this.timeout = null;
				this.filter('processes');
				this.filter('collections');
			}, 500);
		}
	},
	computed: {
		...Utils.mapState('server', ['processes', 'collections'])
	},
	methods: {
		onDrag(event, type, data) {
			event.dataTransfer.setData("application/openeo-" + type, data);
			event.dataTransfer.setData("text/plain", data);
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
			else if (typeof e.summary === 'string' && e.summary.toLowerCase().includes(term)) {
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
				this.emit('showCollectionInfo', id);
			}
		},
		showProcessInfo(id) {
			if (this.supports('listProcesses')) {
				this.emit('showProcessInfo', id);
			}
		},
		insertCollection(id) {
			this.onAddCollection(id);
		},
		insertProcess(id) {
			this.onAddProcess(id);
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
	border: 1px solid #ccc;
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
</style>