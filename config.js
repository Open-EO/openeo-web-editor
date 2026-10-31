export default {
	// Set this to connect to a back-end automatically when opening the Web Editor,
	// so you could set this to https://example.com and then the Web Editor connects
	// to the corresponding back-end automatically.
	serverUrl: '',

	// The name of the service
	serviceName: 'openEO',
	// The name of the app
	appName: 'Web Editor',

	// Skip login and automatically load up the "discovery mode"
	skipLogin: false,

	// Enables client credentials login method (true=enabled, false=disabled)
	clientCredentials: true,

	// Appends a slash to the end of the redirect URL (true=append, false=don't append)
	redirectUrlAppendSlash: false,

	// Default location for maps
	// Default to the center of the EU in Wuerzburg: 
	// https://en.wikipedia.org/wiki/Geographical_midpoint_of_Europe#Geographic_centre_of_the_European_Union
	// The zoom level should show most of Europe
	mapLocation: [49.8, 9.9],
	mapZoom: 4,

	// OSM Nominatim compliant geocoder URL, remove to disable
	geocoder: "https://nominatim.openstreetmap.org/search",

	// A message shown on the login page
	loginMessage: '',

	// The logo to show
	logo: './logo.png',

	// Defaults for notifications
	snotifyDefaults: {
		timeout: 10000,
		titleMaxLength: 30,
		bodyMaxLength: 200,
		showProgressBar: true,
		closeOnClick: true,
		pauseOnHover: true
	},

	// In-browser processing with the openEO Web Engine.
	// The engine processes the data in your browser (Web Workers, WebGPU) on cloud-native data
	// (STAC with COGs etc.) and only reads the data required for the results or the visible map.
	// Set to `null` to disable.
	// - collections: STAC collections (or catalogs) that are provided for `load_collection`,
	//   each with `url` and optionally `id` and `title`. Use `{catalog: url}` to add all collections of a catalog.
	// - examples: User-defined processes, batch jobs and web services that are added when the engine starts
	//   for the first time in a browser, so that users can try it right away. Users can change and delete them,
	//   deleted examples don't come back. `'demo'`: the examples of the engine, which use the collections below
	//   (see `@openeo/web-engine/examples`). Your own: `{processGraphs: [...], jobs: [...], services: [...]}`,
	//   each with a stable `id`. `null` for none.
	// - parameters: Default processing parameters, e.g. `max_pixels`.
	localEngine: {
		collections: [
			{
				id: 'sentinel-2-l2a',
				url: 'https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a',
				title: 'Sentinel-2 L2A (Element 84 Earth Search, COG)'
			},
			{
				id: 'sentinel-2-l2a-zarr',
				url: 'https://stac.core.eopf.eodc.eu/collections/sentinel-2-l2a-zarr3',
				title: 'Sentinel-2 L2A (EOPF Sample Service, Zarr)'
			},
			{
				id: 'brp-crop-parcels',
				url: 'https://data.source.coop/cholmes/portolan-nl/rvo/brp_gewaspercelen/collection.json',
				title: 'BRP crop parcels, Netherlands (Portolan NL, GeoParquet)'
			}
		],
		examples: 'demo',
		parameters: {}
	},

	// List of supported web map services (all lower-cased)
	supportedMapServices: [
		'xyz',
		'wmts'
	],

	// List of supported batch job sharing services
	supportedBatchJobSharingServices: [
		'ShareEditor',
		'CopyUrl',
		'BlueskyShare',
		'MastodonSocialShare',
		'XShare'
	],

	// List of supported web service sharing services
	supportedWebServiceSharingServices: [
		'ShareEditor',
		'CopyUrl',
		'BlueskyShare',
		'MastodonSocialShare',
		'XShare'
	],

	// List of supported wizards
	supportedWizards: [
		{
			component: 'SpectralIndices',
			title: 'Compute Spectral Indices',
			description: 'A spectral index is a mathematical equation that is applied on the various spectral bands of an image per pixel. It is often used to highlight vegetation, urban areas, snow, burn, soil, or water/drought/moisture stress. Provided by Awesome Spectral Indices (https://github.com/awesome-spectral-indices/awesome-spectral-indices).',
			requiredProcesses: ['reduce_dimension']
		}
	],

	// Configure the (base)maps
	basemaps: [
		{
			// Title for the basemap
			title: "OpenStreetMap",
			// Templated URI for the XYZ basemap.
			url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			// Attributon for the basemap. HTML is allowed.
			attributions: '&#169; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors.',
			// Maximum zoom level
			maxZoom: 19
		}
	],

	// Import processes from openeo-community-examples repo
	importCommunityExamples: true,

	// Additional process namespaces to load by default
	processNamespaces: [],

	// Key is the OIDC provider id, value is the client ID
	oidcClientIds: {},

	// Show a warning if HTTP is used instead of HTTPS
	showHttpWarning: true,

	// refresh interval for jobs/user data/services etc. in minutes - doesn't apply to logs.
	// It's recommended to use a value between 1 and 5 minutes.
	dataRefreshInterval: 2,

	// Show or hide experimental and/or deprecated entites by default (e.g. processes, collections)
	showExperimentalByDefault: false,
	showDeprecatedByDefault: false,

	// number of items to show per page in the UI (jobs, services, files, UDPs) - null to disable pagination
	pageLimit: 50,
	
};