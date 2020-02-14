<template>
	<div id="FilePanel" @dragenter="dropZoneInfo(true)" @dragleave="dropZoneInfo(false)" @drop="uploadFiles($event)" @dragover="allowDrop($event)">
		<div class="dropZone" v-show="showUploadDropHint">To upload files, drop them here.</div>
		<div v-show="supports('uploadFile')" class="addFile">
			<input type="file" name="uploadUserFile" id="uploadUserFile" @change="uploadFiles" multiple>
		</div>
		<div class="percent"><div class="used" :class="{error: uploadErrored}" :style="'width: ' + this.uploadProgress + '%; opacity: ' + this.uploadFadeOut"></div></div>
		<DataTable ref="table" :dataSource="listFiles" :columns="columns">
			<template slot="toolbar">
				<button title="Refresh files" v-if="isListDataSupported" @click="updateData()"><i class="fas fa-sync-alt"></i></button> <!-- ToDo: Should be done automatically later -->
			</template>
			<template slot="actions" slot-scope="p">
				<button title="Download" @click="downloadFile(p.row)" v-show="supports('downloadFile')"><i class="fas fa-download"></i></button>
				<button title="Delete" @click="deleteFile(p.row)" v-show="supports('deleteFile')"><i class="fas fa-trash"></i></button>
			</template>
		</DataTable>
	</div>
</template>

<script>
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
			uploadFadeOut: 1,
			showUploadDropHint: 0,
			listFunc: 'listFiles',
			createFunc: 'uploadFile'
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
		allowDrop(ev) {
			if(this.supports('uploadFile')) {
				ev.preventDefault();
				ev.stopPropagation();
			}
		},
		dropZoneInfo(show) {
			this.showUploadDropHint += show ? 1 : -1;
		},
		listFiles() {
			return this.connection.listFiles();
		},
		updateData() {
			this.updateTable(this.$refs.table);
		},
		uploadFiles(e) {
			this.showUploadDropHint = 0;
			var files = [];
			if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
				files = e.dataTransfer.files;
				e.preventDefault();
				e.stopPropagation();
			}
			else if (e.target && e.target.files && e.target.files.length){
				files = e.target.files;
			}
			if(!this.supports('uploadFile')) {
				Utils.error(this, 'Uploading files is not supported.');
				return;
			}
			else if (files.length === 0) {
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
			var virtualFile = this.connection.getFile(file.name);
			virtualFile.uploadFile(file, percent => this.$set(this.uploadProgressPerFile, i, percent))
				.then(uploadedFile => {
					this.$refs.table.replaceData(uploadedFile);
					this.$set(this.uploadProgressPerFile, i, 100);
					Utils.ok(this, 'File upload completed.', file.name);
				}).catch(error => {
					console.error(error);
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
					console.info("File change: " + JSON.stringify(data)); // ToDo: Update table
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
#FilePanel {
	position: relative;
	height: 100%;
	width: 100%;
}
#FilePanel .dropZone {
	width: 100%;
	height: 100%;
	position: absolute;
	top: 0;
	left: 0;
	z-index: 2;
	opacity: 0.8;
	background-color: #fff;
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 1.5em;
	font-weight: bold;
}
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