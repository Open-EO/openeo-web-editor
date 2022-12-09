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

	// Default location for maps
	// Default to the center of the EU in Wuerzburg: 
	// https://en.wikipedia.org/wiki/Geographical_midpoint_of_Europe#Geographic_centre_of_the_European_Union
	// The zoom level should show most of Europe
	mapLocation: [49.8, 9.9],
	mapZoom: 4,

	// A message shown on the login page
	loginMessage: '',

	// The logo to show
	logo: './logo.png',

	// Defaults for notifications
	snotifyDefaults: {
		timeout: 10000,
		titleMaxLength: 30,
		bodyMaxLength: 120,
		showProgressBar: true,
		closeOnClick: true,
		pauseOnHover: true
	},

	// List of supported web map services (all lower-cased)
	supportedMapServices: [
		'xyz',
		'wmts'
	],

	// List of supported batch job sharing services
	supportedBatchJobSharingServices: [
		'CopyUrl',
		'TwitterShare'
	],

	// List of supported web service sharing services
	supportedWebServiceSharingServices: [
		'CopyUrl',
		'TwitterShare'
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

	// Additional process namespaces to load by default
	processNamespaces: [],

	// Key is the OIDC provider id, value is the client ID
	oidcClientIds: {},

	// Show a warning if HTTP is used instead of HTTPS
	showHttpWarning: true,

	// refresh interval for jobs/user data/services etc. in minutes - doesn't apply to logs.
	// It's recommended to use a value between 1 and 5 minutes.
	dataRefreshInterval: 2
	
};