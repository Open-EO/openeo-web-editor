export default {
	// Set this to connect to a back-end automatically when opening the Web Editor,
	// so you could set this to https://example.com and then the Web Editor connects
	// to the corresponding back-end automatically.
	serverUrl: 'https://openeo.cloud',

	// The name of the service
	serviceName: 'openEO Platform',
	// The name of the app
	appName: 'Editor',

	// Skip login and automatically load up the "discovery mode"
	skipLogin: true,

	// A message shown on the login page
	loginMessage: '',

	// The logo to show
	logo: 'https://openeo.cloud/wp-content/themes/openeo_platform/images/logo-pages.svg',

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

	// Configure the (base)map
	basemap: {
		// Templated URI for the XYZ basemap.
		url: 'https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoib3BlbmVvLXBsYXRmb3JtLXd3dSIsImEiOiJja3g0ejcweDYyMDJwMnlwemoxNWZzODhkIn0.laahiz1GmTRq-XhZ29eaDQ',
		// Attributon for the basemap. HTML is allowed.
		attributions: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',
		// Maximum zoom level
		maxZoom: 22
	},

	// Additional process namespaces to load by default
	processNamespaces: [],

	// Key is the OIDC provider id, value is the client ID
	oidcClientIds: {},

	// Show a warning if HTTP is used instead of HTTPS
	showHttpWarning: true,

	// refresh interval for jobs/user data/services etc. in minutes - doesn't apply to logs.
	// It's recommended to use a value between 1 and 5 minutes.
	dataRefreshInterval: 2,

	// URL of the backend for visualizing process graphs
	visualizeProcessGraphUrl: ''
	
};