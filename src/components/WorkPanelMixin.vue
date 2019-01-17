<script>
import EventBus from '../eventbus.js';
import DataTable from './DataTable.vue';
import ConnectionMixin from './ConnectionMixin.vue'

export default {
	mixins: [ConnectionMixin],
	components: {
		DataTable
	},
	data() {
		return {
			columns: {}
		};
	},
	computed: {
		userId: {
			get() {
				return this.connection ? this.connection.getUserId() : null;
			}
		}
	},
	watch: { 
		userId(newVal, oldVal) {
			if (newVal !== oldVal) {
				this.updateData();
			}
		}
	},
	created() {
		EventBus.$on('serverChanged', this.updateData);
	},
	mounted() {
		window.setInterval(this.executeWatchers, 5000);
	},
	methods: {
		updateData() {
			// To be overwritten by implementations
		},
		updateTable(table, listFunc, createFunc) {
			if (!this.$refs.table) {
				return;
			}
			else if (!this.supports('createJob') && !this.supports('listJobs')) {
				this.$refs.table.setNoData(501);  // "feature not supported"
			}
			else if (typeof this.userId !== 'string' && typeof this.userId !== 'number') {
				this.$refs.table.setNoData(401);  // "please authenticate"
			}
			else {
				this.$refs.table.retrieveData();
			}
		},
	}
}
</script>