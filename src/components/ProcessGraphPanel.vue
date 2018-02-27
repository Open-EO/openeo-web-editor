<template>
	<DataTable ref="table" :dataSource="dataSource" :columns="columns" id="ProcessGraphPanel">
		<div slot="toolbar" slot-scope="props">
			<button title="Add new process graph"><i class="fas fa-plus"></i> Add</button>
		</div>
		<div slot="actions" slot-scope="props">
			<button title="Details"><i class="fas fa-info"></i></button>
			<button title="Edit"><i class="fas fa-edit"></i></button>
			<button title="Delete"><i class="fas fa-trash"></i></button>
		</div>
	</DataTable>
</template>

<script>
import EventBus from '../eventbus.js';
import DataTable from './DataTable.vue';

export default {
	name: 'ProcessGraphPanel',
	props: ['userId'],
	components: {
		DataTable
	},
	data() {
		return {
			columns: {
				$: {
					name: 'ID'
				},
				actions: {
					name: 'Actions',
					format: 'Actions',
					id: '$',
					filterable: false
				}
			}
		};
	},
	mounted() {
		this.updateData();
	},
	watch: { 
		userId(newVal, oldVal) {
			this.updateData();
		}
	},
	methods: {
		dataSource() {
			let users = OpenEO.Users.getObject(this.userId);
			return users.getProcessGraphs();
		},
		updateData() {
			if (typeof this.userId !== 'string' && typeof this.userId !== 'number') {
				this.$refs.table.setNoData(401);
				return;
			}
			this.$refs.table.retrieveData();
		}
	}
}
</script>

<style>
#ProcessGraphPanel td {
	width: 50%;
}
</style>