import DataTable from '@openeo/vue-components/components/DataTable.vue';
import Utils from '../utils.js';

export default (namespace, singular, plural, loadInitially = true) => {
	return {
		components: {
			DataTable
		},
		data() {
			return {
				name: singular,
				plualizedName: plural,
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
			...Utils.mapState(namespace, ['pages', 'hasMore']),
			...Utils.mapGetters(namespace, ['supportsList', 'supportsCreate', 'supportsRead', 'supportsUpdate', 'supportsDelete']),
			next() {
				return this.hasMore ? this.nextPage : null;
			}
		},
		methods: {
			...Utils.mapActions(namespace, ['list', 'nextPage', 'create', 'read', 'update', 'delete']),
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
			async reloadData() {
				return await this.updateData(true);
			},
			async updateData(force = false) {
				var table = this.getTable();
				var nextSyncTime = Date.now() - this.getSyncInterval();
				if (!table || (!force && this.lastSyncTime > nextSyncTime)) {
					return false;
				}
				else if (!this.supportsList) {
					table.setNoData("Sorry, listing stored " + plural + " is not supported by the server.");
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
						return true;
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
				return false;
			}
		}
	};
}