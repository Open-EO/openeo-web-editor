<template>
	<div id="FilePanel">
		<div v-show="supports('uploadFile')" class="addFile">
			<input type="file" name="uploadUserFile" id="uploadUserFile">
			<button title="Add new file" id="uploadUserFileBtn" @click="uploadFile()"><i class="fas fa-upload"></i></button>
			<span id="uploadUserFileStatus"></span>
		</div>
		<DataTable ref="table" :dataSource="listFiles" :columns="columns">
			<template slot="toolbar">
				<button title="Refresh files" @click="updateData()"><i class="fas fa-sync-alt"></i></button> <!-- ToDo: Should be done automatically later -->
				<button v-show="!subscribed" title="Subscribe to all changes to the file directory" @click="subscribeToFileChanges()"><i class="fas fa-bell"></i></button>
				<button v-show="subscribed" title="Unsubscribe from all changes to the file directory" @click="unsubscribeFromFileChanges()"><i class="fas fa-bell-slash"></i></button>
			</template>
			<template slot="actions" slot-scope="p">
				<button title="Download" @click="downloadFile(p.row)" v-show="supports('downloadFile')"><i class="fas fa-download"></i></button>
				<button title="Delete" @click="deleteFile(p.row)" v-show="supports('deleteFile')"><i class="fas fa-trash"></i></button>
			</template>
		</DataTable>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';
import WorkPanelMixin from './WorkPanelMixin.vue';

export default {
  	name: 'FilePanel',
	mixins: [WorkPanelMixin],
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
					filterable: false
				}
			},
			subscribed: false
		};
	},
  	methods: {
		listFiles() {
			return this.connection.listFiles();
		},
		updateData() {
			this.updateTable(this.$refs.table, 'listFiles', 'uploadFile');
		},
		uploadFile() {
			var field = document.getElementById('uploadUserFile');
			var status = document.getElementById('uploadUserFileStatus');
			var file = field.files[0];
			console.log(file);

			this.connection.createFile(file.name)
				.then(virtualFile => {
					return virtualFile.uploadFile(file, percent => {
						status.innerText = percent + '%';
					});
				}).then(uploadedFile => {
					// ToDo: This should not be self generated, but the API gives no information yet
					uploadedFile.setAll({
						name: file.name,
						size: file.size,
						modified: (new Date()).toISOString()
					});
					this.$refs.table.replaceData(uploadedFile);
					status.innerText = '';
					field.value = '';
					this.$utils.ok(this, 'File upload completed.');
				}).catch(error => {
					console.log(error);
					status.innerText = '';
					this.$utils.exception(this, error, 'Sorry, file upload failed.');
				});
		},
		downloadFile(file) {
			this.$utils.info(this, 'File requested. Please wait...');
			file.downloadFile(file.name);
		},
		deleteFile(file) {
			file.deleteFile()
				.then(data => {
					this.$refs.table.removeData(file.name);
				})
				.catch(error => {
					this.$utils.error(this, 'Sorry, could not delete file.');
				});
		},
		subscribeToFileChanges() {
			this.connection.subscribe(
				'openeo.files', {},
				(data, info) => {
					console.log("File change: " + JSON.stringify(data));
				}
			);
			this.subscribed = true;
		},
		unsubscribeFromFileChanges(id) {
			this.connection.unsubscribe('openeo.files', {});
			this.subscribed = false;
		}
	}
}
</script>

<style>
#FilePanel .addFile {
	display: flex;
	margin-bottom: 0.5em;
}
#uploadUserFile {
	flex: 12;
}
#uploadUserFileBtn {
	flex: 1;
}
#uploadUserFileStatus {
	text-align: center;
	flex: 2;
}
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