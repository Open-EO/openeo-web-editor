<template>
	<Modal :show="show" title="Import process from external source" @closed="$emit('closed')">
		<template #default>
			<div class="content">
				You can load an external process from multiple different sources:
				<h3>Upload file from your computer</h3>
				<form @submit.prevent.stop="uploadFile">
					<input type="file" name="file" @change="setFile" accept="application/json" /> <button :disabled="!hasFile">Upload</button>
				</form>
				<h3>Download file from the internet</h3>
				<form @submit.prevent.stop="loadUrl">
					<input type="url" name="url" v-model="url" /> <button :disabled="!hasUrl">Load</button>
				</form>
				<template v-if="gh.length > 0">
					<h3>Examples from openEO processes repository</h3>
					<!-- ToDo: Show multiselect component instead -->
					<ul>
						<li v-for="file in gh" :key="file.name"><a @click="request(file.url)">{{ file.name }}</a></li>
					</ul>
				</template>
			</div>
		</template>
		<template #footer>
			<div class="footer">
				<button type="button" :disabled="!process" @click="submit">
					Import
					<template v-if="processId === null">unnamed process</template>
					<code v-else-if="processId">{{ processId }}</code>
				</button>
			</div>
		</template>
	</Modal>
</template>

<script>
import Utils from '../../utils';
import Modal from './Modal.vue';

export default {
	name: 'ImportProcessModal',
	components: {
		Modal
	},
	data() {
		return {
			gh: [],
			process: null,
			url: null,
			file: null,
			show: true
		};
	},
	async created() {
		try {
			let response = await axios('https://api.github.com/repos/Open-EO/openeo-community-examples/git/trees/2babd5d10e56f10d0a51569838227e93fdd934c5'); // the hash is the sha for the processes folder, see https://api.github.com/repos/Open-EO/openeo-community-examples/git/trees
			this.gh = response.data.tree
				.filter(file => file.path.endsWith('.json'))
				.map(file => ({
					name: file.path.substring(0, file.path.length-5),
					url: `https://raw.githubusercontent.com/Open-EO/openeo-community-examples/main/processes/${file.path}`
				}));
		} catch(error) {
			console.warn(error);
		}
	},
	computed: {
		processId() {
			if (Utils.isObject(this.process)) {
				if (this.process.id) {
					return this.process.id;
				}
				else {
					return null;
				}
			}
			return '';
		},
		hasUrl() {
			return Utils.isUrl(this.url);
		},
		hasFile() {
			return !!this.file;
		}
	},
	methods: {
		checkProcess(data) {
			if (typeof data === 'string') {
				try {
					data = JSON.parse(data);
				} catch(error) {
					throw new Error('Process is not valid JSON');
				}
			}
			if (!Utils.isObject(data)) {
				throw new Error('Process does not contain any data');
			}
			if (typeof data.id !== 'string' && !Utils.isObject(data.process_graph)) {
				throw new Error('Process does not contain `id` or `process graph`');
			}
			return data;
		},
		setFile(event) {
			if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
				this.file = event.dataTransfer.files[0];
			}
			else if (event.target && event.target.files && event.target.files.length > 0){
				this.file = event.target.files[0];
			}
			else {
				this.file = null;
			}
		},
		uploadFile() {
			var reader = new FileReader();
			reader.onload = async e => {
				try {
					this.process = this.checkProcess(e.target.result);
				} catch(error) {
					Utils.exception(this, error, "Upload failed");
				}
			};
			reader.onerror = error => Utils.exception(this, error, "Reading JSON file failed");
			reader.readAsText(this.file, "UTF-8");
		},
		loadUrl() {
			this.request(this.url);
		},
		async request(url) {
			try {
				if (!Utils.isUrl(url)) {
					throw new Error('Please provide a valid URL');
				}
				let response = await axios(url);
				this.process = this.checkProcess(response.data);
			} catch(error) {
				Utils.exception(this, error, "Download failed");
			}
		},
		submit() {
			this.$emit('save', this.process);
			this.show = false;
		},
	}
}
</script>

<style scoped lang="scss">
.footer {
	text-align: right;
}
h3 {
	margin-top: 1.5em;
	margin-bottom: 0.5em;
}
form {
	display: flex;
	input {
		flex-grow: 1;
	}
	button {
		min-width: 8em;
	}
}
</style>