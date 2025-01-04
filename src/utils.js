import VueUtils from '@openeo/vue-components/utils';
import { Job, OpenEO, Service, UserFile, UserProcess } from '@openeo/js-client';
import { mapState, mapActions, mapMutations, mapGetters } from 'vuex';
import contentType from 'content-type';
import Config from '../config';
import axios from 'axios';

class Utils extends VueUtils {

	static axios() {
		return OpenEO.Environment.axios;
	}

	static saveToFile(content, filename) {
		return OpenEO.Environment.saveToFile(content, filename);
	}

	static getPreviewLinkFromSTAC(stac) {
		if (Utils.isObject(stac) && Array.isArray(stac.links)) {
			let link = stac.links.find(link => Utils.isObject(link) && typeof link.rel === 'string' && Config.supportedMapServices.includes(link.rel.toLowerCase()));
			if (link) {
				return link;
			}
		}
		return null;
	}

	static isMapServiceSupported(mapType) {
		if (typeof mapType !== 'string') {
			return false;
		}
		return Config.supportedMapServices.includes(mapType.toLowerCase());
	}

	static parseNodata(value) {
		if (Array.isArray(value)) {
			return value.map(nodata => Utils.parseNodata(nodata));
		}
		else {
			return typeof value === "string" && value.toLowerCase() === "nan" ? Number.NaN : value;
		}
	}

	static isActiveJobStatusCode(status) {
		if (typeof status !== 'string') {
			return null;
		}
		switch (status.toLowerCase()) {
			case 'running':
			case 'queued':
				return true;
			default:
				return false;
		}
	}

	static exception(vm, error, alt) {
		console.error(error);
		var buttons = [];
		var title = null; 
		var message = alt;
		if (Utils.isObject(error) && typeof error.message === 'string') {
			if (error.code > 0) {
				title = "Error #" + error.code; 
			}
			else {
				title = alt; 
			}
			message = error.message;

			buttons.push({
				text: 'Show Details',
				action: () => vm.$root.$emit('showError', error)
			});
		}
		else if (typeof error === 'string') {
			message = error; 
			title = alt; 
		}
		buttons.push({
			text: 'Copy',
			action: toast => {
				let success = vm.$clipboard(message);
				let button = toast.config.buttons.find(btn => btn.text === 'Copy');
				if (button) {
					button.text = success ? "✔️ Copied" : "❌ Failed";
				}
			}
		});
		var typeDefaults =  {
			buttons
		}; 
		vm.$snotify.singleError(message, title, Object.assign({}, vm.$config.snotifyDefaults, typeDefaults)); 
	} 
	static error(vm, message, title = null) {
		vm.$snotify.singleError(message, title, vm.$config.snotifyDefaults); 
	}
	static warn(vm, message, title = null) {
		vm.$snotify.warning(message, title, vm.$config.snotifyDefaults);
	}
	static info(vm, message, title = null) {
		vm.$snotify.info(message, title, vm.$config.snotifyDefaults); 
	}
	static ok(vm, message, title = null) {
		vm.$snotify.success(message, title, vm.$config.snotifyDefaults); 
	}
	static confirm(vm, message, buttons = []) {
		var typeDefaults =  {
			buttons: buttons
		}; 
		vm.$snotify.confirm(message, null, Object.assign({}, vm.$config.snotifyDefaults, typeDefaults)); 
	}
	
	static isChildOfModal(that) {
		return that.$parent && that.$parent.$options.name == 'Modal'; 
	}

	static getFileNameFromURL(url) {
		//this removes the anchor at the end, if there is one
		url = url.substring(0, (url.indexOf("#") == -1)?url.length:url.indexOf("#")); 
		//this removes the query after the file name, if there is one
		url = url.substring(0, (url.indexOf("?") == -1)?url.length:url.indexOf("?")); 
		//this removes everything before the last slash in the path
		url = url.substring(url.lastIndexOf("/") + 1, url.length); 
		return url; 
	}

	static makeFileName(filename, type) {
		if (filename.includes('.') || typeof type !== 'string') {
			return filename;
		}
		if (!type.includes('/')) {
			return filename + '.' + type;
		}

		let ext = null;
		try {
			let mime = contentType.parse(type);
			switch(mime.type.toLowerCase()) {
				case 'application/json':
				case 'application/zip':
				case 'image/png':
				case 'image/jpg':
				case 'image/jpeg':
				case 'image/gif':
				case 'image/tiff':
				case 'text/csv':
				case 'text/html':
					ext = type.split('/')[1];
					break;
				case 'text/plain':
					ext = 'txt';
					break;
				case 'application/netcdf':
				case 'application/x-netcdf':
					ext = 'nc'
					break;
			}

		} catch (error) {}

		if (ext !== null) {
			return filename + '.' + ext;
		}
		else {
			return filename;
		}
	}

	static replaceParam(url, paramName, paramValue) {
		var urlObj = new URL(url);
		var query = new URLSearchParams(urlObj.search); 
		query.set(paramName, paramValue);
		urlObj.search = query.toString();
		return urlObj.toString();
	}

	static paramsForPrefix(prefix, sep = '~') {
		prefix += sep;
		const urlParams = new URLSearchParams(window.location.search);
		let params = {};
		for(let [key, value] of urlParams) {
			if (key.startsWith(prefix)) {
				params[key.substring(prefix.length)] = value;
			}
		}
		return params; 
	}

	static param(name) {
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.has(name)) {
			return urlParams.get(name);
		}
		return undefined;
	}

	static isBboxInWebMercator(bboxes) {
		if (!bboxes) {
			return null;
		}
		if (!Array.isArray(bboxes)) {
			bboxes = [bboxes];
		}
		let maxBounds = {south: -85.06, north: 85.06}; // Max. south/north bounds for Web Mercator
		return !bboxes.find(bbox => bbox.south < maxBounds.south || bbox.north > maxBounds.north);
	}
	static extentToBBox(extent) {
		if (!Array.isArray(extent)) {
			return null;
		}
		var hasZ = extent.length >= 6;
        let obj = {
			west: extent[0],
			east: extent[hasZ ? 3 : 2],
			south: extent[1],
			north: extent[hasZ ? 4 : 3]
		};
		if (hasZ) {
			obj.base = extent[2];
			obj.height = extent[5];
		}
		return obj;
	}
	static sortById(a, b) {
		return VueUtils.compareStringCaseInsensitive(a.id, b.id);
	}

	static range(start, end) {
		if (end < start) {
			return [];
		}
		return Array.from({length: 1 + end - start}, (_, i) => start + i);
	}

	static newArray(length, defaultValue = 0) {
		if (length < 1) {
			return [];
		}
		return Array.from({length}, () => defaultValue);
	}

	static fitArray(arr, length, defaultValue = 0) {
		if (length < 1) {
			return [];
		}

		if (length > arr.length) {
			return arr.concat(Utils.newArray(length - arr.length, defaultValue));
		}
		else if (length < arr.length) {
			return arr.slice(0, length);
		}
		else {
			return arr;
		}
	}

	// Based on https://github.com/hughsk/path-sort
	static sortByPath(a, b) {
		a = a.split('/');
		b = b.split('/');
		var l = Math.max(a.length, b.length);
		for (var i = 0; i < l; i += 1) {
			if (!(i in a)) {
				return -1;
			}
			else if (!(i in b)) {
				return 1;
			}
			else if (a[i].toUpperCase() > b[i].toUpperCase()) {
				return 1;
			}
			else if (a[i].toUpperCase() < b[i].toUpperCase()) {
				return -1;
			}
		}
		if (a.length < b.length) {
			return -1;
		}
		else if (a.length > b.length) {
			return 1;
		}
		return 0;
	}

	static getUniqueId() {
		return Math.random().toString(36).substr(2, 9);
	}

	static formatIdOrTitle(value) {
		if (typeof value !== 'string') {
			return value;
		}
		else if (value.startsWith('#')) {
			return `<em class="id">${value}</em>`;
	}
		else if (value === 'Unnamed') {
			return `<em class="unnamed">${value}</em>`;
		}
		else {
			return value;
		}
	}

	static getResourceTitle(obj, showType = false) {
		let title;
		let isObj = Utils.isObject(obj);
		if (typeof obj === 'string') {
			title = obj;
		}
		else if (obj instanceof UserProcess) {
			title = obj.id;
		}
		else if (obj instanceof UserFile) {
			title = obj.path;
		}
		else if (isObj && typeof obj.stac_version === 'string') {
			title = obj.id;
		}
		else if (isObj && obj.title) {
			title = obj.title;
		}
		else if (isObj && obj.id) {
			let id = new String(obj.id);
			if (id.length > 10) {
				title = obj.id.substr(0, 5) + '…' + obj.id.substr(-5);
			}
			else {
				title = obj.id
			}
			title = '#' + title;
		}
		else {
			title = 'Unnamed';
		}
		if (showType) {
			let type;
			if (typeof showType === 'string') {
				type = showType;
			}
			else if (obj instanceof Job) {
				type = 'Job';
			}
			else if (obj instanceof Service) {
				type = 'Service';
			}
			else if (obj instanceof UserProcess) {
				type = 'Process';
			}
			else if (obj instanceof UserFile) {
				type = 'File';
			}
			else if (isObj && typeof obj.stac_version === 'string' && obj.type === 'Collection') {
				type = obj.type;
			}

			if (type) {
				title = `${title} (${type})`;
			}
		}
		return title;
	}

	static resolveJsonRefs(schema) {
		var resolver = obj => {
			if (!obj || typeof obj !== 'object') {
				return obj;
			}
			for(var key in obj) {
				var value = obj[key];
				if (Utils.isObject(value) && typeof value.$ref === 'string' && value.$ref.match(/^#(\/[^\/]+)+$/i)) {
					var parts = value.$ref.split('/').slice(1);
					var result = schema;
					while (parts.length) {
						let propertyName = parts.shift();
						result = result[propertyName];
						if (typeof result === 'undefined') {
							break;
						}
					}
					obj[key] = result;
					continue;
				}

				obj[key] = resolver(value);
			}
			return obj;
		};
		return resolver(schema);
	}
	static extractUDPParams(process) {
		const pos = process.indexOf('@');
		if (pos < 0) {
			return [process, undefined];
		}
		else {
			const id = process.substring(0, pos);
			const namespace = process.substring(pos + 1);
			return [id, namespace];
		}
	}
	static getProcessingExpression(stac) {
		let key = 'processing:expression';
		if (!Utils.isObject(stac) || !stac[key]) {
			return null;
		}
		let obj = stac[key];
		if (Array.isArray(obj)) {
			if (obj.length > 0) {
				obj = obj[0];
			}
			else {
				return null;
			}
		}
		if (Utils.isObject(obj) && obj.format === 'openeo' && Utils.isObject(obj.expression)) {
			return obj.expression;
		}
		else {
			return null;
		}
	}

	static confirmOpenAll(files) {
		return confirm(`You are about to open ${files.length} individual files / tabs, which could slow down the web browser. Are you sure you want to open all of them?`);
	}

};

Utils.mapState = mapState;
Utils.mapGetters = mapGetters;
Utils.mapMutations = mapMutations;
Utils.mapActions = mapActions;

export default Utils;
