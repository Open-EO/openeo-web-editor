import L from "leaflet-geotiff/leaflet-geotiff.js"

L.LeafletGeotiff.CustomRenderer = L.LeafletGeotiffRenderer.extend({
	options: {
		script: null
	},
	initialize(options) {
		this.name = "openEO-geotiff-visualizer";
		L.setOptions(this, options);
	},
	setScript(script) {
		if (script && script.Visualization && script.Visualization.function) {
			this.options.script = script;
		}
        this.parent._reset();
	},
	render(raster, canvas, ctx, args) {
		var hasScript = (this.options.script && this.options.script.Visualization && this.options.script.Visualization.function) ? true : false;
		var imageData = ctx.createImageData(raster.width, raster.height);
		for (var y = 0; y < raster.height; y++) {
			for (var x = 0; x < raster.width; x++) {
				var i = (y*raster.width)+x;
				var input = [raster.data[i], raster.data[i], raster.data[i], 255];
				if (hasScript) {
					input = this.options.script.Visualization.function(input, this.options.script.Visualization.args);
				}
				imageData.data.set(input, ((y*raster.width)+x)*4);
			}
		}
		ctx.putImageData(this.parent.transform(imageData, args), args.xStart, args.yStart); 
	}

});

export default L.LeafletGeotiff.customRenderer = function (options) {
    return new L.LeafletGeotiff.CustomRenderer(options);
};