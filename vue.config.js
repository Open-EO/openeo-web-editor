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
			new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en-gb/)
		],
		optimization: {
			splitChunks: {
				chunks: 'all',
				maxSize: 300000,
				minSize: 300000,
				maxInitialRequests: 8,
				maxAsyncRequests: 1
			}
		}
	}
}