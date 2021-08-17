import VueUtils from '@openeo/vue-components/utils';
import { Job, Service, UserProcess } from '@openeo/js-client';
import { mapState, mapActions, mapMutations, mapGetters } from 'vuex';
import contentType from 'content-type';
import Config from '../config';

class Utils extends VueUtils {

	static getPreviewLinkFromSTAC(stac) {
		if (Utils.isObject(stac) && Array.isArray(stac.links)) {
			let link = stac.links.find(link => Utils.isObject(link) && typeof link.rel === 'string' && Config.supportedMapServices.includes(link.rel.toLowerCase()));
			if (link) {
				return link;
			}
		}
		return null;
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

			let log = {
				id: error.id,
				code: error.code,
				level: 'error',
				message: error.message,
				time: new Date().toISOString(),
				data: error,
				links: error.links
			};
			buttons.push({
				text: 'Show Details',
				action: () => vm.$root.$emit('viewLogs', [log], 'Error', 'fa-bomb')
			});
		}
		else if (typeof error === 'string') {
			message = error; 
			title = alt; 
		}
		var typeDefaults =  {
			closeOnClick: false, 
			buttons
		}; 
		vm.$snotify.error(message, title, Object.assign({}, vm.$config.snotifyDefaults, typeDefaults)); 
	} 
	static error(vm, message, title = null) {
		vm.$snotify.error(message, title, vm.$config.snotifyDefaults); 
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
			closeOnClick: false, 
			buttons: buttons
		}; 
		vm.$snotify.confirm(message, null, Object.assign({}, vm.$config.snotifyDefaults, typeDefaults)); 
	}

	static blobToText(blob, callback) {
		var reader = new FileReader(); 
		reader.onload = callback; 
		reader.readAsText(blob.blob); 
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

	static param(name) {
		const urlParams = new URLSearchParams(window.location.search); 
		return urlParams.get(name); 
	}

	static isUrl(url) {
		return (VueUtils.hasText(url) && url.match(/^https?:\/\//i) !== null);
	}

	static extentToBBox(extent) {
		var hasZ = extent.length > 4;
        return {
			west: extent[0],
			east: extent[hasZ ? 3 : 2],
			south: extent[1],
			north: extent[hasZ ? 4 : 3]
		};
	}
	static sortById(a, b) {
		return VueUtils.compareStringCaseInsensitive(a.id, b.id);
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

	static getResourceTitle(obj, showType = false) {
		let title = '';
		if (showType) {
			if (obj instanceof Job) {
				title += 'Job: ';
			}
			else if (obj instanceof Service) {
				title = 'Service: ';
			}
			else if (obj instanceof UserProcess) {
				title += 'Process: ';
			}
		}
		if (obj instanceof UserProcess) {
			title += obj.id;
		}
		else if (obj.title) {
			title += obj.title;
		}
		else if (obj.id) {
			title += "#" + obj.id.toUpperCase().substr(-6);
		}
		else {
			title += "Unnamed";
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

};

export default Object.assign(Utils, {
	mapState,
	mapGetters,
	mapMutations,
	mapActions
});