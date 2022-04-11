<script>
import Utils from '../../utils.js';

import TextControl from './textControl';
import GeoTIFF from 'ol/source/GeoTIFF';
import TileLayer from 'ol/layer/Tile';

export default {
	data() {
		return {
			textControl: null
		}
	},
	computed: {
		isGeoTiff() {
			return false;
		}
	},
	methods: {
		async updateGeoTiffLayer(data, title = "GeoTiff", context = null) {
			// ToDos:
			// - Pass in overviews
			// - Handle multiple bands
			let min, max, nodata;

			// Try to get metadata from first band
			if (Array.isArray(data['raster:bands']) && data['raster:bands'].length === 1 && Utils.isObject(data['raster:bands'][0])) {
				let band = data['raster:bands'][0];
				nodata = typeof nodata === "string" && nodata.toLowerCase() === "nan" ? Number.NAN : band.nodata;
				if (Utils.isObject(band.statistics)) {
					min = band.statistics.minimum;
					max = band.statistics.maximum;
				}
				else if (typeof band.data_type === 'string') {
					if (band.data_type.startsWith('uint')) {
						min = 0;
					}
					if (band.data_type === 'uint8') {
						max = 255;
					}
					else if (band.data_type === 'int8') {
						max = 127;
					}
					// else: let openlayers choose
				}
			}

			// Set options for GeoTIFF source
			let options = { min, max, nodata };
			if(data.blob instanceof Blob) {
				options.url = URL.createObjectURL(data.blob);
			}
			else {
				options.url = data.url;
			}

			// Create source and automatically derive view from it
			let geotiff = new GeoTIFF({ sources: [options] });
			let view = await geotiff.getView();

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


			let layer = new TileLayer({
				id: options.url,
				title,
				source: geotiff
			});

//			this.addTextControl(layer, min, max, nodata);
			this.addLayerToMap(layer);

			return layer;
		},

		addTextControl(layer, min, max, nodata) {
			this.textControl = new TextControl();
			this.textControl.setValue('Estimated Pixel Value: -');
			layer.set('events', {
				singleclick: evt => {
					const pixel = this.map.getEventPixel(evt.originalEvent);
					this.map.forEachLayerAtPixel(pixel, (_, data) => {
						let value = Utils.displayRGBA(data, min, max, nodata, 5);
						this.textControl.setValue(`Estimated Pixel Value: ${value}`);
						this.textControl.setTitle(`Coordinate: ${evt.coordinate.join(', ')}`);
					});
				}
			});
			layer.set('controls', [this.textControl]);
		},

		getOptionsFromUser(min, max, nodata) {
			if (typeof min !== 'number') {
				min = Number.parseFloat(prompt("Please input the minimum value", min));
			}
			if (typeof max !== 'number') {
				max = Number.parseFloat(prompt("Please input the maximum value", max));
			}
			nodata = prompt("Please input the no-data value (NaN is allowed, too)", nodata);
			if (typeof nodata !== 'string' || nodata.trim().length === 0) {
				nodata = undefined;
			}
			else if (nodata.toLowerCase() === "nan") {
				nodata = Number.NaN;
			}
			else {
				nodata = Number.parseFloat(nodata);
			}
			return { min, max, nodata }
		}
	}
}
</script>