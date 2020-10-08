export default {
	// URL of the back-end to start with (string)
	serverUrl: '',

	// A message shown on the login page
	loginMessage: '<strong>Note:</strong> This version of the Web Editor supports openEO API v1.0. <a href="/0.4">Click here to load the Web Editor supporting openEO API v0.4</a>',

	// Defaults for notifications
	snotifyDefaults: {
		timeout: 5000,
		titleMaxLength: 30,
		showProgressBar: true,
		closeOnClick: true,
		pauseOnHover: true
	},

	// List of supported web map services (all lower-cased)
	supportedMapServices: [
		'xyz'
	],

	// Show a warning if HTTP is used instead of HTTPS
	showHttpWarning: true
};