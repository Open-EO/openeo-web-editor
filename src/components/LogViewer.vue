<template>
	<div class="log-viewer">
		<div class="log-container" v-if="Array.isArray(logs) && logs.length">
			<div class="log-header">
				<MultiSelect v-model="levelsShown" :multiple="true" :options="levels" :allowEmpty="false" :taggable="true" :closeOnSelect="false" placeholder="Select the log levels shown" />
			</div>
			<ul class="log-body">
				<li v-for="log in logs" :key="log.id" v-show="levelsShown.includes(log.level)" :class="{[log.level]: true, expanded: log.expanded}">
					<summary>
						<span class="toggle" @click="toggle(log)">▸</span>
						<span class="log-message">{{ log.message }}</span>
					</summary>
					<ul class="details" v-if="log.expanded">
						<li>ID: {{ log.id }}</li>
						<li v-if="log.code">Code: {{ log.code }}</li>
						<li>Level: {{ log.level }}</li>
						<li v-if="Array.isArray(log.path) && log.path.length">
							Path:
							<ol class="path">
								<li v-for="(path, i) in log.path" :key="i">#{{ path }}</li>
							</ol>
						</li>
						<li v-if="typeof log.data !== 'undefined' && log.data !== null">
							Data:<br />
							<ObjectTree :data="log.data" />
						</li>
						<li v-if="Array.isArray(log.links) && log.links.length">
							Related Resources:<br />
							<LinkList :links="log.links" />
						</li>
					</ul>
				</li>
			</ul>
		</div>
		<div v-else-if="Array.isArray(logs) && !logs.length" class="noDataMessage">No logs available.</div>
		<div v-else class="noDataMessage"><i class="fas fa-spinner fa-spin"></i> Loading logs...</div>
	</div>
</template>

<script>
import Utils from '../utils.js';
import EventBusMixin from './EventBusMixin.vue';
import LinkList from '@openeo/vue-components/components/LinkList.vue';
import MultiSelect from 'vue-multiselect';
import ObjectTree from '@openeo/vue-components/components/ObjectTree.vue';

export default {
	name: 'LogViewer',
	mixins: [EventBusMixin],
	components: {
		LinkList,
		MultiSelect,
		ObjectTree
	},
	props: {
		data: { // => JS Client Job/Service Object or Log Entries
			type: [Object, Array],
			required: true
		}
	},
	data() {
		let levels = [
			'debug',
			'info',
			'warning',
			'error'
		];
		return {
			levels: levels,
			levelsShown: levels,
			logs: null,
			syncTimer: null
		};
	},
	computed: {
		...Utils.mapState(['connection']),
		isJob() {
			return Utils.isObject(this.data) && typeof this.data.debugJob === 'function';
		},
		isService() {
			return Utils.isObject(this.data) && typeof this.data.debugService === 'function';
		},
		logIterator() {
			if (this.isJob) {
				return this.data.debugJob();
			}
			else if (this.isService) {
				return this.data.debugService();
			}
			return null;
		}
	},
	created() {
		if (this.isJob) {
			this.listen('jobStatusUpdated', this.onJobStatusUpdated);
		}
	},
	beforeDestroy() {
		this.onHide();
	},
	methods: {
		toggle(log) {
			this.$set(log, 'expanded', !log.expanded);
		},
		onShow() {
			this.loadNext();
			if (this.isJob) {
				this.onJobStatusUpdated(this.data);
			}
			else if (this.isService) {
				this.startWatcher();
			}
		},
		onHide() {
			this.stopWatcher();
		},
		onJobStatusUpdated(job) {
			if (job !== this.data || typeof this.data.status !== 'string') {
				return;
			}

			switch(this.data.status.toLowerCase()) {
				case 'running':
				case 'queued':
					this.startWatcher();
				break;
				default:
					this.stopWatcher();
			}
		},
		startWatcher() {
			if (this.syncTimer === null) {
				this.syncTimer = setInterval(this.loadNext.bind(this), 10000);
			}
		},
		stopWatcher() {
			if (this.syncTimer !== null) {
				clearInterval(this.syncTimer);
				this.syncTimer = null;
			}
		},
		async loadNext() {
			if (this.logIterator) {
				let logs = await this.logIterator.nextLogs();
				if (!Array.isArray(this.logs)) {
					this.logs = [];
				}
				for(let log of logs) {
					this.logs.push(log);
				}
			}
			else if(Array.isArray(this.data) && !this.logs) {
				this.logs = this.data;
			}
		}
	}
};
</script>

<style scoped>
/* .warning / .error are defined in Page.vue */
.log-viewer, .log-container {
	width: 100%;
	height: 100%;
}
.log-header {
	position: -webkit-sticky;
	position: sticky;
	top: 0;
	width: 100%;
	box-sizing: border-box;
	background-color: white;
	z-index: 1;
}
.log-body {
	list-style-type: none;
	margin: 0;
	padding: 0;
}
.log-body > li {
	padding: 0.25em 0;
}
summary {
	display: flex;
}
summary .log-message {
	flex-grow: 1;
	width: 100%;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.expanded summary .log-message {
	white-space: normal;
	overflow: unset;
	text-overflow: unset;
}
.details {
	margin: 0.5em 0 1em 1.6em;
	padding-left: 1.5em;
	font-size: 0.9em;
}
.info, .debug, .warning, .error {
	width: auto;
}
.info {
	color: black;
}
.debug {
	color: gray;
}
.toggle {
	display: inline-block;
	width: 0.6em;
	height: 1em;
	margin: 0 0.5em;
}
.expanded .toggle {
	top: 1em;
	transform: rotate(90deg);
}
.path {
	display: inline-block;
	margin: 0;
	padding: 0;
	list-style: none;
}
.path li {
	display: inline;
}
.path li+li:before {
	padding: 0.25em;
	content: "❱";
}
</style>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
