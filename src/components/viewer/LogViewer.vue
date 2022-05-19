<template>
	<div class="log-viewer">
		<div v-if="logs === null" class="noDataMessage"><i class="fas fa-spinner fa-spin fa-lg"></i> Loading logs...</div>
		<Logs v-else :logs="logs" />
	</div>
</template>

<script>
import Utils from '../../utils.js';
import EventBusMixin from '../EventBusMixin.vue';
import Logs from '@openeo/vue-components/components/Logs.vue';

export default {
	name: 'LogViewer',
	mixins: [EventBusMixin],
	components: {
		Logs
	},
	props: {
		data: { // => JS Client Job/Service Object or Log Entries
			type: [Object, Array],
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
	mounted() {
		this.$emit('mounted', this);
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

			if (Utils.isActiveJobStatusCode(this.data.status)) {
				this.startWatcher();
			}
			else {
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
			try {
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
			} catch (error) {
				Utils.exeption(this, error, "Loading logs failed");
			}
		}
	}
};
</script>

<style>
.log-viewer, .vue-component.logs {
	width: 100%;
	height: 100%;
}
</style>
