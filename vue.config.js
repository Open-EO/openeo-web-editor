module.exports = {
	// Path where this instance of the web editor is hosted (string)
	publicPath: process.env.CLIENT_URL || '/',
	devServer: {
		// Port where the dev server runs (int)
		port: 80
	}
}