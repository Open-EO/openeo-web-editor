<script>
import DataTable from './DataTable.vue';
import ConnectionMixin from './ConnectionMixin.vue';
import Utils from '../utils.js';

export default {
	mixins: [ConnectionMixin],
	components: {
		DataTable
	},
	data() {
		return {
			columns: {},
			listFunc: null,
			createFunc: null,
			syncTimer: null,
			lastSyncTime: null
		};
	},
	mounted() {
		this.updateData();
	},
	beforeDestroy() {
		this.stopSyncTimer();
	},
	methods: {
		onShow() {
			this.updateData();
			this.startSyncTimer();
		},
		onHide() {
			this.stopSyncTimer();
		},
		startSyncTimer() {
			if (this.supports(this.listFunc)) {
				this.syncTimer = setInterval(this.updateData, this.getSyncInterval()*1000);
			}
		},
		stopSyncTimer() {
			if (this.syncTimer !== null) {
				clearInterval(this.syncTimer);
			}
		},
		getSyncInterval() {
			return 2*60; // Refresh data every two minutes
		},
		updateData() {
			// To be overwritten by implementations
		},
		updateTable(table) {
			var nextSyncTime = Date.now() - this.getSyncInterval() * 1000;
			if (!table || this.lastSyncTime > nextSyncTime) {
				return;
			}
			else if (!this.supports(this.listFunc)) {
				table.setNoData('Sorry, listing stored data is not supported by the server.');
			}
			else if (!this.supports(this.createFunc)) {
				table.setNoData('Sorry, this feature is not supported by the server.');
			}
			else {
				table.retrieveData();
				this.lastSyncTime = Date.now();
			}
		},
	}
}
</script>