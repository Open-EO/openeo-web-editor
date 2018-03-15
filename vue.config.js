var Config = require('./src/config.js');

module.exports = {
	baseUrl: Config.clientUrl,
	devServer: {
		port: Config.devPort
	}
}