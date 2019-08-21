const webpack = require('webpack');

module.exports = {
	// Path where this instance of the web editor is hosted (string)
	publicPath: process.env.CLIENT_URL || '/',
	devServer: {
		// Port where the dev server runs (int)
		port: 80
	},
	configureWebpack: {
		devtool: 'source-map',
		plugins: [
			new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en-gb/),
		]
	},
	pluginOptions: {
		webpackBundleAnalyzer: {
			openAnalyzer: false
		}
	}
}