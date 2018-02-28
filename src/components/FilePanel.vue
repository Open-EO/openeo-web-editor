<template>
	<DataTable ref="table" :dataSource="dataSource" :columns="columns" id="FilePanel">
		<div slot="toolbar" slot-scope="p">
			<button title="Add new file"><i class="fas fa-plus"></i> Add</button>
		</div>
		<div slot="actions" slot-scope="p">
			<button title="Download" @click="downloadFile(p.row[p.col.id])"><i class="fas fa-download"></i></button>
			<button title="Delete" @click="deleteFile(p.row[p.col.id])"><i class="fas fa-trash"></i></button>
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
					name: 'Path / Name',
					primaryKey: true
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
		EventBus.$on('serverChanged', this.updateData);
	},
	watch: { 
		userId(newVal, oldVal) {
			this.updateData();
		}
	},
  	methods: {
		dataSource() {
			let users = this.$OpenEO.Users.getObject(this.userId);
			return users.getFiles();
		},
		updateData() {
			if (typeof this.userId !== 'string' && typeof this.userId !== 'number') {
				this.$refs.table.setNoData(401);
				return;
			}
			this.$refs.table.retrieveData();
		},
		downloadFile(id) {
			try {
				var fileApi = this.$OpenEO.Users.getObject(this.userId).getFileObject(id);
				fileApi.get();
			} catch(e) {
				this.$utils.error(this, e.message);
			}
		},
		deleteFile(id) {
			try {
				var fileApi = this.$OpenEO.Users.getObject(this.userId).getFileObject(id);
				fileApi.delete()
					.then(data => {
						this.$refs.table.removeData(id);
					})
					.catch(errorCode => {
						// ToDo
					});
			} catch (e) {
				this.$utils.error(this, e.message);
			}
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