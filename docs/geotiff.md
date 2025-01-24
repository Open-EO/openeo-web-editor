# (Cloud-Optimized) GeoTiffs in the Web Editor

What is required by back-ends to give users an ideal experience with GeoTiff imagery in the Web Editor?

1. All GeoTiffs must be valid GeoTiffs (including all required metadata) and should be valid cloud-optimized (COGs). If the files are not exported as COGs, the Editor needs to read the whole GeoTiff file at once which will usually fail with larger files (> 10 MB).
2. Range requests must be supported by the server to allow reading COGs.
3. [CORS](https://api.openeo.org/draft/index.html#section/Cross-Origin-Resource-Sharing-(CORS)/CORS-headers) must be sent by the server providing the files, especially you need to allow `Range` headers in `Access-Control-Expose-Headers` additionally.
4. COGs should provide overviews in the files whenever the files get larger than 1 or 2 MB in size. The overview tiles should have a size of at least 128x128 pixels and at maximum 512x512 pixels.
5. The GeoTiff must be readable by [geotiff.js](https://geotiffjs.github.io/geotiff.js/), especially the data type and the compression must be supported.
6. The GeoTiff metadata in the file should contain:
    1. The no-data value in [`TIFFTAG_GDAL_NODATA`](https://gdal.org/drivers/raster/gtiff.html#nodata-value), if applicable
	2. A projection, via the ["geo keys"](http://geotiff.maptools.org/spec/geotiff2.4.html) `ProjectedCSTypeGeoKey` or `GeographicTypeGeoKey` (otherwise provide at least a unit in `ProjLinearUnitsGeoKey` or `GeogAngularUnitsGeoKey`)
	3. GDAL metadata should be provided in the tag [`TIFFTAG_GDAL_METADATA`](https://gdal.org/drivers/raster/gtiff.html#metadata) per band:
		1. Minimum and Maximum values (tags: `STATISTICS_MINIMUM` and `STATISTICS_MAXIMUM`)
		2. A band name (tag: `DESCRIPTION`)
	5. The [`PhotometricInterpretation`](https://www.awaresystems.be/imaging/tiff/tifftags/photometricinterpretation.html) of the image should be set to `1` (BlackIsZero) if an RGB interpretation is not clear. If RGB is set as interpretation (`2`) and you have more than 3 samples per pixel ([`SamplesPerPixel`](https://www.awaresystems.be/imaging/tiff/tifftags/samplesperpixel.html)), the [`ExtraSamples`](https://www.awaresystems.be/imaging/tiff/tifftags/extrasamples.html) should be set.
	6. [`ColorMap`](https://www.awaresystems.be/imaging/tiff/tifftags/colormap.html)s are supported.
7. For batch jobs, the STAC metadata is recommended to contain per asset:
    1. The no-data value either in `file:nodata` (deprecated) or in `nodata` in `bands`
	2. The `minimum` and `maximum` values per band in the `statistics` object in `bands`
	3. A band `name` in `bands`
	4. The projection in `proj:code` (recommended), `proj:wkt2` (not well supported by OpenLayers) or `proj:proj4` (deprecated by STAC)
	5. The `type` must be set to the corresponding media type (see below)
8. For synchronous execution, the `Content-Type` in the header of the response must be set to the corresponding media type (see below)

Links to the corresponding STAC extensions:
- [eo](https://github.com/stac-extensions/eo)
- [file](https://github.com/stac-extensions/file/tree/v1.0.0) (v1.0.0, latest is v2.1.0 but doesn't support nodata any more)
- [proj](https://github.com/stac-extensions/projection)
- [raster](https://github.com/stac-extensions/raster)

Media Types:
- COGs (`image/tiff; application=geotiff; cloud-optimized=true`)
- GeoTiffs (`image/tiff; application=geotiff`)
