<script>
import proj4 from 'proj4';
import { fromLonLat, get as getProjection } from 'ol/proj';
import { register } from 'ol/proj/proj4';

export default {
	methods: {
		async loadProjection(crs) {
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
				return this.addProjection(code, proj[id]);
			}

			// No projection found
			return null;
		},

		addProjection(code, meta) {
			try {
				proj4.defs(code, meta);
				register(proj4);
				return getProjection(code);
			} catch (error) {
				console.error(error);
				return null;
			}
		},
		fromLonLat(coords) {
			return fromLonLat(coords, this.map.getView().getProjection());
		}
	}
};
</script>
