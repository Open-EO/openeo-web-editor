<template>
	<DataTable ref="table" :dataSource="dataSource" :columns="columns" id="FilePanel">
		<div slot="toolbar" slot-scope="p">
			<span v-show="openEO.Capabilities.uploadUserFile()">
				<input type="file" name="uploadUserFile" id="uploadUserFile">
				<button title="Add new file" id="uploadUserFileBtn" @click="uploadFile()"><i class="fas fa-upload"></i></button>
				<span id="uploadUserFileStatus"></span>
			</span>
			<button title="Refresh files" @click="updateData()"><i class="fas fa-sync-alt"></i></button> <!-- ToDo: Should be done automatically later -->
		</div>
		<div slot="actions" slot-scope="p">
			<button title="Download" @click="downloadFile(p.row[p.col.id])" v-show="openEO.Capabilities.downloadUserFile()"><i class="fas fa-download"></i></button>
			<button title="Delete" @click="deleteFile(p.row[p.col.id])" v-show="openEO.Capabilities.deleteUserFile()"><i class="fas fa-trash"></i></button>
		</div>
	</DataTable>
</template>

<script>
import EventBus from '../eventbus.js';
import DataTable from './DataTable.vue';

export default {
  	name: 'FilePanel',
	props: ['openEO','userId'],
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
					filterable: false,
					id: 'name'
				}
			}
		};
	},
	created() {
		EventBus.$on('serverChanged', this.updateData);
	},
	watch: { 
		userId(newVal, oldVal) {
			if (newVal !== null) {
				this.updateData();
			}
		}
	},
  	methods: {
		dataSource() {
			let users = this.openEO.Users.getObject(this.userId);
			return users.getFiles();
		},
		updateData() {
			if (!this.$refs.table || !this.openEO.Capabilities.userFiles()) {
				return;
			}
			else if (typeof this.userId !== 'string' && typeof this.userId !== 'number') {
				this.$refs.table.setNoData(401);
			}
			else {
				this.$refs.table.retrieveData();
			}
		},
		uploadFile() {
			var field = document.getElementById('uploadUserFile');
			var status = document.getElementById('uploadUserFileStatus');
			var file = field.files[0];
			var fileApi = this.openEO.Users.getObject(this.userId).getFileObject(file.name);
			fileApi.replace(file, percent => {
				status.innerText = percent + '%';
			}).then(data => {
				// ToDo: This should not be self generated
				this.$refs.table.replaceData({
					"name": file.name,
					"size": file.size,
					"modified": (new Date()).toISOString()
				});
				status.innerText = '';
				field.value = '';
				this.$utils.ok(this, 'File upload completed.');
			}).catch(error => {
				status.innerText = '';
				this.$utils.error(this, 'Sorry, file upload failed.');
			});
		},
		downloadFile(id) {
			this.$utils.info(this, 'Download requested. Please wait...');
			var fileApi = this.openEO.Users.getObject(this.userId).getFileObject(id);
			fileApi.get().then(data => {
				this.$utils.downloadData(data, id);
			});
		},
		deleteFile(id) {
			var fileApi = this.openEO.Users.getObject(this.userId).getFileObject(id);
			fileApi.delete()
				.then(data => {
					this.$refs.table.removeData(id);
				})
				.catch(error => {
					this.$utils.error(this, 'Sorry, could not delete file.');
				});
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