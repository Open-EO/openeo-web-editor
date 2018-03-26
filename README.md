# openEO Web Editor
A web-based editor for interactive usage of the openEO API (proof-of-concept).

## Usage
You can use the **[demo](https://open-eo.github.io/openeo-web-editor/demo/)** or build the files yourself (see Development section) and deploy them to any web host.

## Development
1. Configure the web editor by editing `config.js`
2. Install the dependencies: `npm install`
3. 
    * Either run the development server by executing `npm run serve`
    * or build the project by executing `npm run build` and uploading the content of the `dist` folder to your server.

## Important dependencies
Built with [Vue.js](https://vuejs.org/), [Leaflet](http://leafletjs.com/), [CodeMirror](https://codemirror.net/) and the [openEO JS Client](https://github.com/Open-EO/openeo-js-client), of course.