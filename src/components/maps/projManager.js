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

	// Get projection details from STAC (todo: add collection support)
	static async addFromStac(stac) {
		if (Utils.isObject(stac) && Utils.isObject(stac.properties)) {
			if (stac.properties['proj:code']) {
				return await ProjManager.get(stac.properties['proj:code']);
			}
			else if (stac.properties['proj:wkt2']) {
				return ProjManager.add(stac.id, stac.properties['proj:wkt2']);
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
		let epsg = await import('../../assets/epsg-proj.json');
		if (id in epsg) {
			return ProjManager.add(code, epsg[id][0], epsg[id][1]);
		}

		// No projection found
		return null;
	}

}