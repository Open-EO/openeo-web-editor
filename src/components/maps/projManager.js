import proj4 from 'proj4';
import { get as getProjection, transformExtent } from 'ol/proj';
import Projection from 'ol/proj/Projection';
import { register } from 'ol/proj/proj4';

import Utils from '../../utils';

export default class ProjManager {

	static async get(data) {
		if (data instanceof Projection) {
			return data;
		}

		return await ProjManager._load(data);
	}

	static add(code, meta, extent) {
		try {
			proj4.defs(code, meta);
			register(proj4);
			let projection = getProjection(code);
			if (Array.isArray(extent)) {
				extent = transformExtent(extent, 'EPSG:4326', projection);
				projection.setExtent(extent);
			}
			if (meta.includes('+datum=WGS84')) {
				projection.basemap = true;
			}
			return projection;
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	static async addFromStacItem(stac) {
		if (Utils.isObject(stac)) {
			return await this.addFromStacObject(stac.properties, stac.id);
		}
		return null;
	}

	// Get projection details from STAC Asset
	static async addFromStacAsset(asset) {
		return await this.addFromStacObject(asset, asset.href);
	}

	// Get projection details from STAC Asset
	static async addFromStacObject(obj, id) {
		if (Utils.isObject(obj)) {
			if (obj['proj:epsg']) {
				return await ProjManager.get(obj['proj:epsg']);
			}
			else if (obj['equi7:proj']) {
				return ProjManager.add(id, obj['equi7:proj']);
			}
			else if (obj['proj:wkt2']) {
				return ProjManager.add(id, obj['proj:wkt2']);
			}
		}
		return null;
	}

	static async _load(crs) {
		let code, id;
		if (typeof crs === 'string' && crs.match(/^EPSG:\d+$/i)) {
			code = crs.toUpperCase();
			id = crs.substr(5);
		}
		else if (Number.isInteger(crs)) {
			code = `EPSG:${crs}`
			id = String(crs);
		}
		else {
			return null;
		}

		// Get projection from cache
		let projection = getProjection(code);
		if (projection) {
			return projection;
		}

		// Get projection from database
		let proj = await import('../../assets/epsg-proj.json');
		if (id in proj) {
			return ProjManager.add(code, proj[id][0], proj[id][1]);
		}

		// No projection found
		return null;
	}

}