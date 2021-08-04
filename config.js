export default {
	// Set this to connect to a back-end automatically when opening the Web Editor,
	// so you could set this to https://example.com and then the Web Editor connects
	// to the corresponding back-end automatically.
	serverUrl: 'https://openeo.cloud',

	// Skip login and automatically load up the "discovery mode"
	skipLogin: false,

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

	// Key is the OIDC provider id, value is the client ID
	oidcClientIds: {
		'egi-dev': 'openeo-platform'
	},

	// Show a warning if HTTP is used instead of HTTPS
	showHttpWarning: true,

	// refresh interval for jobs/user data/services etc. in minutes - doesn't apply to logs.
	// It's recommended to use a value between 1 and 5 minutes.
	dataRefreshInterval: 2
	
};