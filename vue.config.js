const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

module.exports = {
	// Path where this instance of the web editor is hosted (string)
	// For example, if you host the web editor at the root of your domain (e.g. https://example.com),
	// you can leave this as it is (`/`).
	// If you'd like to host it in a sub-sirectory, e.g. https://editor.openeo.org/somewhere/else/,
	// you need to set this to `/somewhere/else/`.
	// You can provide this option via the environment variable CLIENT_URL, too.
	publicPath: process.env.CLIENT_URL || '/',
	devServer: {
		// Port where the development server runs (int)
		// This is only needed for `npm start`
		port: 80
	},
	configureWebpack: {
		devtool: 'source-map',
        externals: {
			// Leaflet is part of openeo-vue-components, but not needed here as we use OpenLayers
            leaflet: 'L'
        },
		optimization: {
			splitChunks: {
				chunks: 'all',
				maxSize: 300000,
				maxInitialRequests: 8,
				maxAsyncRequests: 1
			}
		},
		resolve: {
			fallback: {
				fs: false
			}
		}
	},
	chainWebpack: webpackConfig => {
		webpackConfig.plugin('polyfills').use(NodePolyfillPlugin);
	}
}