<template>
	<div id="FilePanel" @dragenter="dropZoneInfo(true)" @dragleave="dropZoneInfo(false)" @drop="uploadFiles($event)" @dragover="allowDrop($event)">
		<div class="dropZone" v-show="showUploadDropHint">To upload files, drop them here.</div>
		<DataTable ref="table" :data="data" :columns="columns">
			<template slot="toolbar">
				<div v-show="supportsCreate" class="upload">
					<div class="percent" :class="{active: this.uploadProgress > 0}"><div class="used" :class="{error: uploadErrored}" :style="'width: ' + this.uploadProgress + '%; opacity: ' + this.uploadFadeOut"></div></div>
					<div class="addFile">
						<input type="file" name="uploadUserFile" class="uploadUserFile" ref="uploadUserFile" @change="uploadFiles" multiple>
					</div>
				</div>
			</template>
			<template #actions="p">
				<button title="Download" @click="downloadFile(p.row)" v-show="supportsRead"><i class="fas fa-download"></i></button>
				<button title="Delete" @click="deleteFile(p.row)" v-show="supportsDelete"><i class="fas fa-trash"></i></button>
			</template>
		</DataTable>
	</div>
</template>

<script>
import WorkPanelMixin from './WorkPanelMixin';
import Utils from '../utils.js';

export default {
  	name: 'FilePanel',
	mixins: [WorkPanelMixin('files', 'file', 'files')],
	data() {
		return {
			columns: {
				path: {
					name: 'Path',
					primaryKey: true,
					sortFn: Utils.sortByPath,
					sort: 'asc'
				},
				size: {
					name: 'Size',
					format: "FileSize",
					filterable: false
				},
				modified: {
					name: 'Last modified',
					format: 'Timestamp'
				},
				actions: {
					name: 'Actions',
					filterable: false,
					sort: false
				}
			},
			uploadProgress: 0,
			uploadProgressPerFile: [],
			uploadErrored: false,
			uploadFadeOut: 1,
			showUploadDropHint: 0
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
			if(this.supportsCreate) {
				ev.preventDefault();
				ev.stopPropagation();
			}
		},
		dropZoneInfo(show) {
			this.showUploadDropHint += show ? 1 : -1;
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
			if(!this.supportsCreate) {
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
		async uploadFile(file, i) {
			this.uploadProgressPerFile.push(0);
			if (typeof file.name !== 'string') {
				return;
			}

			try {
				await this.create({parameters: [
					file,
					null,
					percent => this.$set(this.uploadProgressPerFile, i, percent)
				]});
				this.$set(this.uploadProgressPerFile, i, 100);
				Utils.ok(this, 'File upload completed.', file.name);
			} catch (error) {
				console.error(error);
				Utils.exception(this, error, "Upload File Error: " + file.name);
			}
		},
		finishAllUploads() {
			this.$refs.uploadUserFile.value = '';
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
			file.downloadFile(file.path);
		},
		deleteFile(file) {
			if (!confirm(`Do you really want to delete the file "${file.path}"?`)) {
				return;
			}
			this.delete({data: file})
				.catch(error => Utils.exception(this, error, 'Delete File Error: ' + file.path));
		}
	}
}
</script>

<style lang="scss">
#FilePanel {
	position: relative;
	height: 100%;
	width: 100%;

	.dropZone {
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
	.addFile {
		display: flex;
		padding-bottom: 1px;

		button {
			margin: 0;
		}
	}
	.path {
		width: 50%;
	}
	td.path {
		word-break: break-all;
	}
	td.size, td.modified {
		text-align: right;
	}
	.uploadUserFile {
		padding: 0;
		flex-grow: 1;
		border: 0;
	}
	.percent {
		margin: -0.5em;
		margin-bottom: 0.3em;
		height: 0.3em;

		&.active {
			background-color: #eee;
		}

		.used {
			background-color: green;
			width: 0;
			height: 0.3em;

			&.errored {
				background-color: maroon;
			}
		}
	}
}
</style>