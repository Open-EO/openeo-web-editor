<script>
import Utils from '../../utils.js';

import TextControl from './TextControl.vue';
import ChannelControl from './ChannelControl.vue';

import GeoTIFF from 'ol/source/GeoTIFF';
import TileLayer from 'ol/layer/WebGLTile';

export default {
	components: {
		ChannelControl,
		TextControl
	},
	data() {
		return {
			textControlText: 'Pixel Value: -',
			glTileLayer: null,
			channels: [],
			nodata: undefined,
			bands: [],
			hasStyle: false
		}
	},
	computed: {
		glStyleVars() {
			if (this.channels.length === 0) {
				return null;
			}
			let vars = {};
			for(let i in this.channels) {
				let channel = this.channels[i];
				vars[String(i)] = channel.id;
				vars[`${i}min`] = channel.min;
				vars[`${i}max`] = channel.max;
			}
			// vars[`nodata`] = this.nodata;
			return vars;
		},
		glStyle() {
			let color = ['color'];
			if (this.channels.length === 0) {
				return null;
			}
			if (this.channels.length >= 3) {
				color.push(this.getFormula(0));
				color.push(this.getFormula(1));
				color.push(this.getFormula(2));
				color.push(['*', ['band', this.bands.length + 1], 255]);
			}
			else {
				let formula = this.getFormula(0);
				color.push(formula);
				color.push(formula);
				color.push(formula);
				color.push(['*', ['band', this.bands.length + 1], 255]);
				// color.push(['match', ['var', 'nodata'], ['band', 1], 0, 1]);
			}
			return {variables: this.glStyleVars, color};
		}
	},
	methods: {
		getBandVar(i) {
			return ['band', ['var', String(i)]];
		},

		getFormula(i) {
			let min = ['var', `${i}min`];
			let max = ['var', `${i}max`];
			let x = this.getBandVar(i);
			return ['*', ['/', ['-', x, min], ['-', max, min]], 255]; // Linear scaling from min - max to 0 - 255
		},
		async addGeoTiff(data, title = "GeoTiff", context = null) {
			this.bands = [];
			this.nodata = Utils.parseNodata(data['file:nodata']);
			if (Array.isArray(data['eo:bands']) && data['eo:bands'].length > 0) {
				this.bands = data['eo:bands'].map((band, i) => ({id: i+1, name: band.name}));
			}
			if (Array.isArray(data['raster:bands']) && data['raster:bands'].length > 0) {
				for (let i in data['raster:bands']) {
					let rasterBand = data['raster:bands'][i];

					let band = {
						id: i+1,
						min: Utils.isObject(rasterBand.statistics) ? rasterBand.statistics.minimum : null,
						max: Utils.isObject(rasterBand.statistics) ? rasterBand.statistics.maximum : null
					};
					if (this.bands[i]) {
						Object.assign(this.bands[i], band);
					}
					else {
						this.bands.push(band);
					}

					if (typeof this.nodata === 'undefined' && typeof rasterBand.nodata !== 'undefined') {
						this.nodata = Utils.parseNodata(rasterBand.nodata);
					}
				}
			}
			// Set options for GeoTIFF source
			let options = {
				normalize: false,
				convertToRGB: true,
				// nodata: this.nodata,
				url: data.getUrl()
			};
			// Create source and automatically derive view from it
			let geotiff = new GeoTIFF({ sources: [options] });
			let view = await geotiff.getView();

			if (this.bands.length === 0) {
				this.bands = Utils.range(1, geotiff.bandCount)
					.map(id => ({ id, min: null, max: null }));
				// Remove the alpha band if present at the end
				if (geotiff.addAlpha_) {
					this.bands.pop();
				}
			}

			// Load projection from GeoTiff / database
			let projection = await this.loadProjection(view.projection.getCode());
			// Get projection details from STAC Item (todo: add collection support)
			if (!projection && context && Utils.isObject(context.properties)) {
				if (context.properties['proj:epsg']) {
					projection = this.loadProjection(context.properties['proj:epsg']);
				}
				else if (context.properties['proj:wkt2']) {
					projection = this.addProjection(context.id, context.properties['proj:wkt2']);
				}
			}
			if (!projection) {
				throw new Error("The projection is not supported.");
			}

			this.glTileLayer = new TileLayer({
				id: options.url,
				title,
				source: geotiff
			});

			this.glTileLayer.set('events', {
				pointermove: evt => {
					let data = this.glTileLayer.getData(evt.pixel);
					let value = Utils.displayRGBA(data);
					let valueText = `Pixel Value: ${value}`;
					this.textControlText = [valueText, `${valueText} @ ${evt.coordinate.map(x => String(x.toFixed(6)).replace(/0+$/, '')).join(', ')}`];
				}
			});

			this.addLayerToMap(this.glTileLayer);

			return this.glTileLayer;
		},

		updateGeoTiffStyle(type, data) {
			switch(type) {
				case 'channels': 
					this.channels = data;
					break;
				case 'nodata': 
					this.nodata = data;
					break;
			}
			if (this.glTileLayer) {
				if (!this.hasStyle) {
					this.glTileLayer.setStyle(this.glStyle);
					this.hasStyle = true;
				}
				else {
					this.glTileLayer.updateStyleVariables(this.glStyleVars);
				}
			}
		}
	}
}
</script>