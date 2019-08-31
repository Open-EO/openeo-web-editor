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
			createFunc: null
		};
	},
	computed: {
		...Utils.mapGetters('server', ['isAuthenticated']),
		isListDataSupported() {
			return (this.isAuthenticated && this.supports(this.listFunc));
		}
	},
	watch: { 
		isAuthenticated(authenticated, beforeAuthenticated) {
			if (authenticated && !beforeAuthenticated) {
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
		updateTable(table) {
			if (!table) {
				return;
			}
			else if (!this.isAuthenticated) {
				table.setNoData('Please authenticate to list stored data.');
			}
			else if (!this.supports(this.listFunc)) {
				table.setNoData('Sorry, listing stored data is not supported by the server.');
			}
			else if (!this.supports(this.createFunc)) {
				table.setNoData('Sorry, this feature is not supported by the server.');
			}
			else {
				table.retrieveData();
			}
		},
	}
}
</script>