// A file to decode: either a Blob/File, a URL (optionally authenticated) or a directory of files
export default class DataInput {

	constructor({ name = null, type = null, blob = null, url = null, headers = {}, files = null, download = null }) {
		this.name = name || (blob && blob.name) || (url ? decodeURIComponent(url.split(/[?#]/)[0].split('/').pop()) : 'data');
		this.type = (type || (blob && blob.type) || '').toLowerCase().split(';')[0].trim();
		this.blob = blob;
		this.url = url;
		this.headers = headers;
		// Map of relative path => File for directories (e.g. Zarr stores)
		this.files = files;
		// Custom downloader for URLs, e.g. the openEO connection with authentication
		this._download = download;
		this._blobPromise = null;
	}

	get extension() {
		const name = this.name.toLowerCase();
		for (const ext of ['.zarr.zip', '.tar.gz']) {
			if (name.endsWith(ext)) {
				return ext.slice(1);
			}
		}
		const i = name.lastIndexOf('.');
		return i >= 0 ? name.slice(i + 1) : '';
	}

	get isDirectory() {
		return this.files instanceof Map;
	}

	async getBlob() {
		if (this.blob) {
			return this.blob;
		}
		if (!this._blobPromise) {
			this._blobPromise = (async () => {
				if (this._download) {
					return await this._download(this.url);
				}
				const response = await fetch(this.url, { headers: this.headers });
				if (!response.ok) {
					throw new Error(`Download failed with status ${response.status}: ${this.url}`);
				}
				return await response.blob();
			})();
		}
		this.blob = await this._blobPromise;
		return this.blob;
	}

	async arrayBuffer() {
		return await (await this.getBlob()).arrayBuffer();
	}

	async text() {
		return await (await this.getBlob()).text();
	}

	async head(n = 16) {
		if (this.isDirectory) {
			return new Uint8Array(0);
		}
		if (!this.blob && this.url && !this.url.startsWith('blob:')) {
			try {
				const response = await fetch(this.url, { headers: { ...this.headers, Range: `bytes=0-${n - 1}` } });
				if (response.status === 206) {
					return new Uint8Array(await response.arrayBuffer()).slice(0, n);
				}
				if (response.ok && !this._download) {
					this.blob = await response.blob();
				}
				else if (response.body) {
					response.body.cancel();
				}
			} catch (e) {
				// fall back to a full download
			}
		}
		return new Uint8Array(await (await this.getBlob()).slice(0, n).arrayBuffer());
	}

}
