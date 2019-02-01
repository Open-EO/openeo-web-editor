export default {

	snotifyDefaults: {
		timeout: 5000,
		titleMaxLength: 30,
		showProgressBar: true,
		closeOnClick: true,
		pauseOnHover: true
	},

	exception(vm, error, alt) {
		console.log(error);
		var title = null;
		var message = alt;
		if (this.isObject(error) && typeof error.message === 'string') {
			if (error.code > 0) {
				title = "Error #" + error.code;
			}
			else {
				title = alt;
			}
			message = error.message;
		}
		else if (typeof error === 'string') {
			message = error;
			title = alt;
		}
		this.error(vm, message, title);
	},
	error(vm, message, title = null) {
		vm.$snotify.error(message, title, this.snotifyDefaults);
	},
	info(vm, message, title = null) {
		vm.$snotify.info(message, title, this.snotifyDefaults);
	},
	ok(vm, message, title = null) {
		var typeDefaults = {
			timeout: 2000
		};
		vm.$snotify.success(message, title, Object.assign({}, this.snotifyDefaults, typeDefaults));
	},
	confirm(vm, message, customOptions) {
		var typeDefaults = {
			timeout: 10000,
			closeOnClick: false
		};
		vm.$snotify.confirm(message, null, Object.assign({}, this.snotifyDefaults, typeDefaults, customOptions));
	},

	blobToText(blob, callback) {
		var reader = new FileReader();
		reader.onload = callback;
		reader.readAsText(blob);
	},

	isNumeric(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	},

	isChildOfModal(that) {
		return that.$parent && that.$parent.$options.name == 'Modal';
	},

	getFileNameFromURL(url) {
		//this removes the anchor at the end, if there is one
		url = url.substring(0, (url.indexOf("#") == -1) ? url.length : url.indexOf("#"));
		//this removes the query after the file name, if there is one
		url = url.substring(0, (url.indexOf("?") == -1) ? url.length : url.indexOf("?"));
		//this removes everything before the last slash in the path
		url = url.substring(url.lastIndexOf("/") + 1, url.length);
		return url;
	},

	formatDateTime(value) {
		if (!value) {
			return '';
		}
		let date = new Date(value);
		return date.toISOString().replace('T', ' ').replace('Z', '').substring(0,19);
	},

	param(name) {
		const urlParams = new URLSearchParams(window.location.search);
		return urlParams.get(name);
	},

	isUrl(url) {
		return (typeof url === 'string' && url.length > 0 && url.match(/^https?:\/\//i) !== null);
	},

	isObject(value) {
		return (typeof value === 'object' && value !== null && !Array.isArray(value));
	}

};