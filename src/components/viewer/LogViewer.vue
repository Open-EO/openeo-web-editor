<template>
	<div class="log-viewer">
		<div v-if="logs === null" class="no-data"><i class="fas fa-spinner fa-spin fa-lg"></i> Loading logs...</div>
		<Logs v-else :logs="logs" :missing="missing" :federation="federation" />
	</div>
</template>

<script>
import Utils from '../../utils.js';
import EventBusMixin from '../EventBusMixin.js';
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
			missing: null,
			syncTimer: null
		};
	},
	computed: {
		...Utils.mapState(['connection']),
		...Utils.mapGetters(['federation']),
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
	watch: {
		logIterator(it) {
			this.missing = it ? it.getMissingBackends() : null;
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
					// If no logs have been set of the offset parameter is unsupported and we got the full list of logs again
					// assign the full list instead of appding it. Vue will make sure to not refresh the existing elements.
					if (!Array.isArray(this.logs) || (this.logs.length > 0 && logs.length > 0 && logs[0].id == this.logs[0].id)) {
						this.logs = logs;
					}
					else {
						// Append all retrieved logs, push is faster than concat!
						for(let log of logs) {
							this.logs.push(log);
						}
					}
				}
				else if(Array.isArray(this.data) && !this.logs) {
					this.logs = this.data;
				}
			} catch (error) {
				Utils.exception(this, error, "Loading logs failed");
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
