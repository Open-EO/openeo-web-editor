
import Config from '../config';
import { Utils as CommonUtils } from '@openeo/js-commons';
import { Utils as VueUtils } from '@openeo/vue-components';
import { Job, Service, UserProcess } from '@openeo/js-client';
import { mapState, mapActions, mapMutations, mapGetters } from 'vuex';

export default {

	exception(vm, error, alt) {
		console.error(error); 
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
		vm.$snotify.error(message, title, Config.snotifyDefaults); 
	}, 
	info(vm, message, title = null) {
		vm.$snotify.info(message, title, Config.snotifyDefaults); 
	}, 
	ok(vm, message, title = null) {
		var typeDefaults =  {
			timeout:2000
		}; 
		vm.$snotify.success(message, title, Object.assign( {}, Config.snotifyDefaults, typeDefaults)); 
	}, 
	confirm(vm, message, buttons = []) {
		var typeDefaults =  {
			timeout:10000, 
			closeOnClick:false, 
			buttons:buttons
		}; 
		vm.$snotify.confirm(message, null, Object.assign( {}, Config.snotifyDefaults, typeDefaults)); 
	}, 

	blobToText(blob, callback) {
		var reader = new FileReader(); 
		reader.onload = callback; 
		reader.readAsText(blob); 
	}, 

	isChildOfModal(that) {
		return that.$parent && that.$parent.$options.name == 'Modal'; 
	}, 

	getFileNameFromURL(url) {
		//this removes the anchor at the end, if there is one
		url = url.substring(0, (url.indexOf("#") == -1)?url.length:url.indexOf("#")); 
		//this removes the query after the file name, if there is one
		url = url.substring(0, (url.indexOf("?") == -1)?url.length:url.indexOf("?")); 
		//this removes everything before the last slash in the path
		url = url.substring(url.lastIndexOf("/") + 1, url.length); 
		return url; 
	}, 

	formatDateTime(value) {
		if (!value) {
			return ''; 
		}
		let date = new Date(value); 
		return date.toISOString().replace('T', ' ').replace('Z', '').substring(0, 19); 
	},

	replaceParam(url, paramName, paramValue) {
		var urlObj = new URL(url);
		var query = new URLSearchParams(urlObj.search); 
		query.set(paramName, paramValue);
		urlObj.search = query.toString();
		return urlObj.toString();
	},

	param(name) {
		const urlParams = new URLSearchParams(window.location.search); 
		return urlParams.get(name); 
	}, 

	isUrl(url) {
		return (typeof url === 'string' && url.length > 0 && url.match(/^https?:\/\//i) !== null);
	}, 

	isObject(value) {
		return CommonUtils.isObject(value); 
	},

	size(obj) {
		return CommonUtils.size(obj);
	},

	deepClone(obj) {
		return CommonUtils.deepClone(obj);
	},

	domBoundingBox(el) {
		var rect = el.getBoundingClientRect();
		rect.offsetTop = rect.top + document.body.scrollTop;
		rect.offsetLeft = rect.left + document.body.scrollLeft;
		return rect;
	},

	extentToBBox(extent) {
		var hasZ = extent.length > 4;
        return {
			west: extent[0],
			east: extent[hasZ ? 3 : 2],
			south: extent[1],
			north: extent[hasZ ? 4 : 3]
		};
	},

	// A very rough GeoJSON validation if no GeoJSON schema is available.
	validateGeoJsonSimple(data) {
		if (!this.isObject(data)) {
			return false;
		}
		else if (typeof data.type !== 'string') {
			return false;
		}

		switch(data.type) {
			case "Point":
			case "MultiPoint":
			case "LineString":
			case "MultiLineString":
			case "Polygon":
			case "MultiPolygon":
				if (!Array.isArray(data.coordinates)) {
					return false;
				}
				return true;
			case "GeometryCollection":
				if (!Array.isArray(data.geometries)) {
					return false;
				}
				return true;
			case "Feature":
				if (data.geometry !== null && !this.isObject(data.geometry)) {
					return false;
				}
				if (data.properties !== null && !this.isObject(data.properties)) {
					return false;
				}
				return true;
			case "FeatureCollection":
				if (!Array.isArray(data.features)) {
					return false;
				}
				return true;
			default:
				return false;
		}
	},

	sortById(a, b) {
		return VueUtils.compareStringCaseInsensitive(a.id, b.id);
	},

	// Based on https://github.com/hughsk/path-sort
	sortByPath(a, b) {
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
	},

	getUniqueId() {
		return Math.random().toString(36).substr(2, 9);
	},

	getResourceTitle(obj, showType = false) {
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
		if (obj.title || obj.summary && obj.id) {
			title += obj.title || obj.summary;
		}
		else if (obj.id) {
			title += "#" + obj.id.toUpperCase().substr(-6);
		}
		else {
			title += "Unnamed";
		}
		return title;
	},

	isRef(obj) {
		return (this.isObject(obj) && (obj.from_parameter || obj.from_node));
	},

	ensurePoint(pt, fallback = null) {
		if (typeof fallback !== 'function') {
			fallback = () => [0,0];
		}
		if (!Array.isArray(pt)) {
			return fallback();
		}
		if (typeof pt[0] !== 'number') {
			pt[0] = fallback()[0] || 0;
		}
		if (typeof pt[1] !== 'number') {
			pt[1] = fallback()[1] || 0;
		}
		return pt;
	},

	isRefEqual(ref1, ref2) {
		if (!this.isRef(ref1) || !this.isRef(ref2)) {
			return false;
		}
		else if (ref1.from_parameter && ref1.from_parameter === ref2.from_parameter) {
			return true;
		}
		else if (ref1.from_node && ref1.from_node === ref2.from_node) {
			return true;
		}
		return false;
	},

	formatRef(value) {
		if (this.isRef(value)) {
			if (value.from_node) {
				return "#" + value.from_node;
			}
			else if (value.from_parameter) {
				return "$" + value.from_parameter;
			}
		}
		return value;
	},

	resolveJsonRefs(schema) {
		var resolver = obj => {
			if (!obj || typeof obj !== 'object') {
				return obj;
			}
			for(var key in obj) {
				var value = obj[key];
				if (this.isObject(value) && typeof value.$ref === 'string' && value.$ref.match(/^#(\/[^\/]+)+$/i)) {
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
	},

	mapState,
	mapGetters,
	mapMutations,
	mapActions

}; 