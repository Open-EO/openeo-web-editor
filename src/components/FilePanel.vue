<template>
	<DataTable ref="table" :dataSource="dataSource" :columns="columns" id="FilePanel">
		<div slot="toolbar" slot-scope="props">
			<button title="Add new file"><i class="fas fa-plus"></i> Add</button>
		</div>
		<div slot="actions" slot-scope="props">
			<button title="Download"><i class="fas fa-download"></i></button>
			<button title="Delete"><i class="fas fa-trash"></i></button>
		</div>
	</DataTable>
</template>

<script>
import EventBus from '../eventbus.js';
import DataTable from './DataTable.vue';

export default {
  	name: 'FilePanel',
	props: ['userId'],
	components: {
		DataTable
	},
	data() {
		return {
			columns: {
				name: {
					name: 'Path / Name'
				},
				size: {
					name: 'Size',
					format: "FileSize",
					filterable: false
				},
				modified: {
					name: 'Last modified',
					format: 'DateTime'
				},
				actions: {
					name: 'Actions',
					format: 'Actions',
					filterable: false,
					id: 'name'
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
			return users.getFiles();
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
#FilePanel .name {
	width: 50%;
}
#FilePanel td.name {
	word-break: break-all;
}
#FilePanel .size {
	width: 10%;
}
#FilePanel .modified {
	width: 20%;
}
#FilePanel td.size, #FilePanel td.modified {
	text-align: right;
}
</style>