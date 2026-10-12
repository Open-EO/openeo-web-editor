import { markRaw } from 'vue';
import { SupportedFormat } from './format';
import DataInput from '../data/input';
import { readDataset } from '../data/readers';
import { isDesktop, saveFile } from '../platform';
import Utils from '../utils';

// Any file that is decoded by the data layer and shown in the preview pane
export default class DataFile extends SupportedFormat {

	constructor(asset, stac = null, input = null) {
		super(asset, 'PreviewPane', 'fa-file');
		this.stac = stac;
		this.input = input;
		this.dataset = null;
		this._input = null;
	}

	isBinary() {
		return true;
	}

	canGroup() {
		return true;
	}

	getFileName() {
		if (this.input) {
			return this.input.name;
		}
		if (this.title) {
			return this.title;
		}
		const href = this.getUrl();
		if (typeof href === 'string' && !href.startsWith('blob:')) {
			return decodeURIComponent(href.split(/[?#]/)[0].split('/').pop());
		}
		return Utils.makeFileName('result', this.type);
	}

	createInput(connection) {
		if (this.input) {
			return this.input;
		}
		if (!this._input) {
			this._input = this._createInput(connection);
		}
		return this._input;
	}

	_createInput(connection) {
		const name = this.getFileName();
		if (this.blob) {
			return new DataInput({ name, type: this.type, blob: this.blob });
		}
		const url = this.getUrl();
		if (url.startsWith('blob:')) {
			return new DataInput({ name, type: this.type, url });
		}
		let headers = {};
		let auth = false;
		try {
			auth = Boolean(connection) && new URL(connection.getUrl()).origin === new URL(url).origin;
			if (auth) {
				headers = connection._getAuthHeaders();
			}
		} catch (error) {
			// relative or invalid URLs are fetched without authentication
		}
		return new DataInput({
			name,
			type: this.type,
			url,
			headers,
			download: connection ? (u => connection.download(u, auth)) : null
		});
	}

	async loadData(connection) {
		if (!this.loaded) {
			// Vue 2 would otherwise observe decoders, WASM handles and large arrays deeply
			this.dataset = markRaw(await readDataset(this.createInput(connection), { asset: this, stac: this.stac }));
			if (!this.title && this.dataset.title) {
				this.title = this.dataset.title;
			}
			this.icon = DataFile.iconFor(this.dataset);
			this.loaded = true;
		}
		return this.dataset;
	}

	getData() {
		return this.dataset;
	}

	download(filename = null) {
		filename = filename || this.getFileName();
		const input = this.input || this._input;
		// Re-use the (authenticated) input so that the desktop app can save to a chosen location
		if (isDesktop && input && !input.isDirectory) {
			return input.getBlob()
				.then(blob => saveFile(blob, filename))
				.catch(error => console.error(error));
		}
		return super.download(filename);
	}

	unload() {
		if (this.dataset) {
			this.dataset.destroy();
		}
		this.dataset = null;
		this.loaded = false;
	}

	getContext() {
		return this.context || this.stac;
	}

	static iconFor(ds) {
		if (ds.hasMap) {
			return 'fa-map';
		}
		if (ds.rasters.length > 0) {
			return 'fa-image';
		}
		if (ds.charts.length > 0) {
			return 'fa-chart-line';
		}
		if (ds.tables.length > 0) {
			return 'fa-table';
		}
		return 'fa-file';
	}

}
