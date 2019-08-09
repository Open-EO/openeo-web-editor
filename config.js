export default {
	// URL of the back-end to start with (string)
	serverUrl: '',

	// A message shown on the login page
	loginMessage: '<b>Credentials for the Google Earth Engine platform:</b><table><tr><td>Server:</td><td>https://earthengine.openeo.org</td></tr><tr><td>User:</td><td>group8</td></tr><tr><td>Password:&nbsp;&nbsp;</td><td>test123</td></tr></table><br>Contact <a href="mailto:m.mohr@uni-muenster.de">m.mohr@uni-muenster.de</a> for further information, bug reports or if you\'d like to test other platforms.<br><br>Please keep in mind that this is a very early beta version. The software and services are not always stable yet!',

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
	]
};