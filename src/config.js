export default {

	serverUrl: 'http://localhost:8000/',
	allowServerChange: true,
	defaultScript: `// Create the process graph
OpenEO.Editor.ProcessGraph = OpenEO.ImageCollection.create('Sentinel2A-L1C')
	.filter_daterange("2018-01-01","2018-01-31")
	.NDVI("B04","B08")
	.max_time();`
};