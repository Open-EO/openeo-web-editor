<script>
import EventBus from '@openeo/vue-components/eventbus.js';
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
	mounted() {
		this.updateData();
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
				this.$refs.table.setNoData('Sorry, this feature is not supported by the server.');
			}
			else if (typeof this.userId !== 'string' && typeof this.userId !== 'number') {
				this.$refs.table.setNoData('Please authenticate to use this feature.');
			}
			else {
				this.$refs.table.retrieveData();
			}
		},
	}
}
</script>