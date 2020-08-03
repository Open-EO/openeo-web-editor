<template>
	<div class="logViewer">
		<div v-if="Array.isArray(logs) && logs.length">
			<ul>
				<li v-for="log in logs" :key="log.id" :class="log.level">
					{{ log.message }}
				</li>
			</ul>
		</div>
		<div v-else-if="Array.isArray(logs) && !logs.length" class="noDataMessage">No logs available.</div>
		<div v-else class="noDataMessage"><i class="fas fa-spinner fa-spin"></i> Loading logs...</div>
	</div>
</template>

<script>
import Utils from '../utils.js';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';

export default {
	name: 'LogViewer',
	mixins: [EventBusMixin],
	props: {
		data: { // => JS Client Job Object
			type: Object,
			required: true
		}
	},
	data() {
		return {
			logs: null,
			syncTimer: null
		};
	},
	computed: {
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
			if (!this.logIterator) {
				this.logs = [];
				return;
			}
			let logs = await this.logIterator.nextLogs();
			if (!Array.isArray(this.logs)) {
				this.logs = [];
			}
			for(let log of logs) {
				this.logs.push(log);
			}
		}
	}
};
</script>

<style scoped>
.error {
	color: rgb(128, 0, 0);
}
.warning {
	color: rgb(128, 83, 0);
}
.info {
	color: black;
}
.debug {
	color: gray;
}
</style>
