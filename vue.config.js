const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const webpack = require('webpack')
const path = require('path')

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
	css: {
		loaderOptions: {
			sass: {
				api: 'modern-compiler' // Use modern Sass API
			}
		}
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
		webpackConfig.plugin('stac-fields-fix').use(webpack.NormalModuleReplacementPlugin, [
			/StacFields\.vue$/,
			function(resource) {
				if (resource.context.includes('@openeo') && resource.context.includes('vue-components')) {
					resource.request = path.resolve(__dirname, 'src/components/StacFields.vue');
				}
			}
		]);
	}
}