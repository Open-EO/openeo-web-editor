var Config = require('./src/config.js');

module.exports = {
	baseUrl: process.env.CLIENT_URL || Config.clientUrl,
	devServer: {
		port: Config.devPort
	}
}