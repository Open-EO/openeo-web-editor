<template>
	<div id="FilePanel">
		<div v-show="supports('uploadFile')" class="addFile">
			<input type="file" name="uploadUserFile" id="uploadUserFile" @change="uploadFiles" multiple>
		</div>
		<div class="percent"><div class="used" :class="{error: uploadErrored}" :style="'width: ' + this.uploadProgress + '%; opacity: ' + this.uploadFadeOut"></div></div>
		<DataTable ref="table" :dataSource="listFiles" :columns="columns">
			<template slot="toolbar">
				<button title="Refresh files" @click="updateData()"><i class="fas fa-sync-alt"></i></button> <!-- ToDo: Should be done automatically later -->
			<!--<button v-show="!subscribed" title="Subscribe to all changes to the file directory" @click="subscribeToFileChanges()"><i class="fas fa-bell"></i></button>
				<button v-show="subscribed" title="Unsubscribe from all changes to the file directory" @click="unsubscribeFromFileChanges()"><i class="fas fa-bell-slash"></i></button> -->
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
import Utils from '../utils.js';

export default {
  	name: 'FilePanel',
	mixins: [WorkPanelMixin],
	data() {
		return {
			columns: {
				path: {
					name: 'Path',
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
			subscribed: false,
			uploadProgress: 0,
			uploadProgressPerFile: [],
			uploadErrored: false,
			uploadFadeOut: 1
		};
	},
	watch: {
		uploadProgressPerFile: {
			deep: true,
			handler() {
				this.uploadProgress = this.uploadProgressPerFile.reduce((a,b) => a + b, 0) / this.uploadProgressPerFile.length;
				if (this.uploadProgress > 99.9999) {
					this.finishAllUploads();
				}
			}
		}
	},
  	methods: {
		listFiles() {
			return this.connection.listFiles();
		},
		updateData() {
			this.updateTable(this.$refs.table, 'listFiles', 'uploadFile');
		},
		uploadFiles(e) {
			var files = e.target.files || e.dataTransfer.files;
			if (!files || !files.length) {
				Utils.info(this, 'Please select files to upload.');
				return;
			}
			this.uploadProgressPerFile = [];
			this.uploadProgress = 0;
			this.uploadErrored = false;
			for (let i = 0; i < files.length; i++) {
				this.uploadFile(files[i], i);
			}
		},
		uploadFile(file, i) {
			this.uploadProgressPerFile.push(0);
			if (typeof file.name !== 'string') {
				return;
			}
			var virtualFile = this.connection.openFile(file.name);
			virtualFile.uploadFile(file, percent => this.$set(this.uploadProgressPerFile, i, percent))
				.then(uploadedFile => {
					this.$refs.table.replaceData(uploadedFile);
					this.$set(this.uploadProgressPerFile, i, 100);
					Utils.ok(this, 'File upload completed.', file.name);
				}).catch(error => {
					console.log(error);
					Utils.exception(this, error, file.name);
				});
		},
		finishAllUploads() {
			document.getElementById('uploadUserFile').value = '';
			var t = setInterval(() => {
				this.uploadFadeOut -= 0.05;
				if (this.uploadFadeOut < 0) {
					this.uploadProgress = 0;
					this.uploadFadeOut = 1;
					clearInterval(t);
				}
			}, 100);
		},
		downloadFile(file) {
			Utils.info(this, 'File requested. Please wait...');
			file.downloadFile(file.path);
		},
		deleteFile(file) {
			file.deleteFile()
				.then(data => {
					this.$refs.table.removeData(file.path);
				})
				.catch(error => {
					Utils.error(this, 'Sorry, could not delete file.');
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
	padding-bottom: 1px;
}
#FilePanel .addFile button {
	margin: 0;
}
#FilePanel .path {
	width: 50%;
}
#FilePanel td.path {
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
#uploadUserFile {
	flex-grow: 1;
}
#FilePanel .percent {
	background-color: #eee;
	height: 3px;
	margin-bottom: 5px;
}
#FilePanel .percent .used {
	background-color: green;
	width: 0;
	height: 3px;
}
#FilePanel .percent .used.errored {
	background-color: maroon;
}
</style>