<template>
	<div class="discovery-toolbar" v-if="showCollectionSelector || showProcessSelector">
		<div class="collections-toolbar" v-if="showCollectionSelector">
			<span>Collections:</span>
			<select id="collection" ref="collection">
				<option v-for="d in collections" :key="d.id" :value="d.id">{{ d.id }}</option>
			</select>
			<button type="button" id="insertCollection" @click="insertCollection" title="Insert into script"><i class="fas fa-plus"></i></button>
			<button type="button" @click="showSelectedCollectionInfo" title="Show details" v-show="supports('describeCollection')"><i class="fas fa-info"></i></button>
		</div>
		<div class="processes-toolbar" v-if="showProcessSelector">
			<span>Processes:</span>
			<select id="processes" ref="process">
				<option v-for="p in processes" :key="p.id" :value="p.id" :title="p.summary ? p.summary : ''">{{ p.id }}</option>
			</select>
			<button type="button" id="insertProcesses" @click="insertProcess" title="Insert into script"><i class="fas fa-plus"></i></button>
			<button type="button" @click="showSelectedProcessInfo" title="Show details" v-show="supports('listProcesses')"><i class="fas fa-info"></i></button>
		</div>
	</div>
</template>

<script>
import Config from '../../config.js';
import EventBus from '../eventbus.js';
import ConnectionMixin from './ConnectionMixin.vue';
import Utils from '../utils.js';

export default {
	name: 'DiscoveryToolbar',
	mixins: [ConnectionMixin],
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
	computed: {
		...Utils.mapState('server', ['processes', 'collections']),

		showCollectionSelector() {
			return this.supports('listCollections') && this.collections.length > 0;
		},

		showProcessSelector() {
			return this.supports('listProcesses') && this.processes.length > 0;
		},
	},
	methods: {
		showSelectedCollectionInfo() {
			EventBus.$emit('showCollectionInfo', this.$refs.collection.value);
		},

		showSelectedProcessInfo() {
			EventBus.$emit('showProcessInfo', this.$refs.process.value);
		},
		insertCollection() {
			this.onAddCollection(this.$refs.collection.value);
		},

		insertProcess() {
			this.onAddProcess(this.$refs.process.value);
		}
	}
}
</script>

<style scoped>
.discovery-toolbar {
	border-top: 1px solid #ccc;
	padding: 5px;
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
}
.collections-toolbar, .processes-toolbar {
	display: flex;
    flex-direction: row;
    align-items: center;
	min-width: 200px;
}
#collection, #processes {
	flex-grow: 1;
	margin-left: 0.2em;
	min-width: 100px;
}
</style>