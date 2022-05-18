import DataTable from '@openeo/vue-components/components/DataTable.vue';
import Utils from '../utils.js';

export default (namespace, singular, plural, loadInitially = true) => {
	return {
		components: {
			DataTable
		},
		data() {
			return {
				columns: {},
				syncTimer: null,
				lastSyncTime: null
			};
		},
		mounted() {
			if (loadInitially) {
				this.updateData();
			}
		},
		beforeDestroy() {
			this.stopSyncTimer();
		},
		computed: {
			...Utils.mapState(namespace, {data: namespace}),
			...Utils.mapGetters(namespace, ['supportsList', 'supportsCreate', 'supportsRead', 'supportsUpdate', 'supportsDelete'])
		},
		methods: {
			...Utils.mapActions(namespace, ['list', 'create', 'read', 'update', 'delete']),
			getTable() { // To be overridden
				return this.$refs && this.$refs.table ? this.$refs.table : null;
			},
			onShow() {
				this.updateData().catch(error => Utils.exception(this, error, `Updating ${plural} failed`));
				this.startSyncTimer();
			},
			onHide() {
				this.stopSyncTimer();
			},
			startSyncTimer() {
				if (this.supportsList && this.syncTimer === null) {
					this.syncTimer = setInterval(this.updateData, this.getSyncInterval());
				}
			},
			stopSyncTimer() {
				if (this.syncTimer !== null) {
					clearInterval(this.syncTimer);
					this.syncTimer = null;
				}
			},
			getSyncInterval() {
				return this.$config.dataRefreshInterval*60*1000; // Refresh data every x minutes
			},
			async refreshElement(obj, callback = null) {
				var old = Object.assign({}, obj);
				try {
					let updated = await this.read({data: obj});
					if (typeof callback === 'function') {
						callback(updated, old);
					}
				} catch(error) {
					Utils.exception(this, error, "Load " + singular + " error");
				}
			},
			async updateData() {
				var table = this.getTable();
				var nextSyncTime = Date.now() - this.getSyncInterval();
				if (!table || this.lastSyncTime > nextSyncTime) {
					return;
				}
				else if (!this.supportsList) {
					table.setNoData("Sorry, listing stored " + plural + " is not supported by the server.");
				}
				else if (!this.supportsCreate) {
					table.setNoData("Sorry, this feature is not supported by the server.");
				}
				else {
					var isUpdate = this.data.length > 0;
					if (!isUpdate) {
						table.setNoData("Loading " + plural + "...");
					}
					this.lastSyncTime = Date.now();
					try {
						let data = await this.list();
						if(data.length == 0) {
							table.setNoData("Add your first " + singular + " here...");
						}
					} catch(error) {
						if (!isUpdate) {
							Utils.exception(this, error);
							table.setNoData("Sorry, unable to load data from the server.");
						}
						else {
							console.log(error);
						}
					}
				}
			}
		}
	};
}