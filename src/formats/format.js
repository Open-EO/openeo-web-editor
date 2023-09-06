import Utils from '../utils.js';

export class Format {

	constructor(asset) {
		Object.assign(this, asset);
		this.context = null;
	}

	setContext(context) {
		this.context = context;
	}

	getContext() {
		return this.context;
	}

	getUrl() {
		return this.href;
	}

	canGroup() {
		return false;
	}

	isBinary() {
		return true;
	}

	download(filename = null) {
		let tempLink = document.createElement('a');
		tempLink.style.display = 'none';
		tempLink.href = this.getUrl();
		tempLink.setAttribute('download', filename ? filename :  Utils.makeFileName("result", this.type));
		tempLink.setAttribute('target', '_blank');
		document.body.appendChild(tempLink);
		tempLink.click();
		document.body.removeChild(tempLink);
	}

	async loadData(connection) {
		if (!this.loaded) {
			this.data = await this.fetchData(connection);
			this.loaded = true;
		}
	}

	getData() {
		if (!this.loaded) {
			throw new Error('Data must be loaded before');
		}
		return this.data;
	}

	async fetchData(connection) {
		let blob;
		let url = this.getUrl();
		if (url.startsWith('blob:')) {
			let response = await fetch(url);
			blob = await response.blob();
		}
		else {
			let auth = false;
			try {
				let apiUrl = new URL(connection.getUrl());
				let requestUrl = new URL(url);
				auth = apiUrl.origin === requestUrl.origin;
			} catch (error) {}

			blob = await connection.download(url, auth);
		}
		let promise = new Promise((resolve, reject) => {
			let reader = new FileReader();
			reader.onload = event => resolve(event.target.result);
			reader.onerror = reject;
			if (this.isBinary()) {
				reader.readAsBinaryString(blob);
			}
			else {
				reader.readAsText(blob);
			}
		});
		let data = await promise;
		return await this.parseData(data);
	}

	async parseData(data) {
		return data;
	}

}

export class SupportedFormat extends Format {

	constructor(asset, component = null, icon = 'fa-database', props = {}, events = {}) {
		super(asset);
		this.loaded = false;
		this.component = component;
		this.props = props;
		if (!this.props.data) {
			this.props.data = this;
		}
		this.icon = icon;
		this.events = events;
	}

	isBinary() {
		return false;
	}

}

export class UnsupportedFormat extends Format {

	constructor(asset) {
		super(asset);
	}

}

export class FormatCollection extends SupportedFormat {

}