import DataTable from './DataTable.vue';
import Utils from '../utils.js';

export default (namespace, singular, plural) => {
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
			this.updateData();
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
				this.updateData();
				this.startSyncTimer();
			},
			onHide() {
				this.stopSyncTimer();
			},
			startSyncTimer() {
				if (this.supportsList && this.syncTimer === null) {
					this.syncTimer = setInterval(this.updateData, this.getSyncInterval()*1000);
				}
			},
			stopSyncTimer() {
				if (this.syncTimer !== null) {
					clearInterval(this.syncTimer);
					this.syncTimer = null;
				}
			},
			getSyncInterval() {
				return 2*60; // Refresh data every two minutes
			},
			refreshElement(obj, callback = null) {
				var old = Object.assign({}, obj);
				this.read({data: obj})
					.then(updated => {
						if (typeof callback === 'function') {
							callback(updated, old);
						}
					})
					.catch(error => Utils.exception(this, error, "Load " + singular + " error"));
			},
			updateData() {
				var table = this.getTable();
				var nextSyncTime = Date.now() - this.getSyncInterval() * 1000;
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
					this.list()
						.then(data => {
							if(data.length == 0) {
								table.setNoData("Add your first " + singular + " here...");
							}
						})
						.catch(error => {
							if (!isUpdate) {
								table.setNoData(error);
							}
							else {
								console.log(error);
							}
						});
				}
			}
		}
	};
}