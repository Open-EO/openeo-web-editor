# openEO Web Editor
A web-based editor for interactive usage of the openEO API (proof-of-concept).

## Getting Started
You can use the online **[demo](https://open-eo.github.io/openeo-web-editor/demo/)** or build the files yourself and deploy them to any web host.

1. Install [Node.js](https://nodejs.org/)
2. Clone or download this repository.
3. Open a command line window and go to the directory which contains the cloned/downloaded web editor files.
4. Optionally: Configure the web editor by editing `config.js` to suit your needs.
6. Install the dependencies by executing `npm install` on the command line
7. 
    * Development: Run the development server by executing `npm run serve`.
    * Deployment: Build the project by executing `npm run build`. Afterwards upload the content of the `dist` folder to your server.

## Built With
* [Vue.js](https://vuejs.org/) and some plugins - UI framework
* [Leaflet](http://leafletjs.com/) and multiple plugins - Map visualization
* [CodeMirror](https://codemirror.net/) - Source code editor
* [openEO JS Client](https://github.com/Open-EO/openeo-js-client) - openEO client

## License
This project is licensed under the Apache 2.0 license - see the [LICENSE.md](LICENSE.md) file for details.
