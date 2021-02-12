# openEO Web Editor
A web-based editor for interactive usage of the openEO API.

The Web Editor currently **supports openEO API versions v1.0.x** (including 1.0.0-rc.2).

## Getting Started
The most recent stable version is always available at [editor.openeo.org](https://editor.openeo.org).
There's also a (potentially unstable) [demo](https://open-eo.github.io/openeo-web-editor/demo/) of the development version with all the newest features.

You can also build the files yourself and deploy them to any web host:

1. Install [Node.js](https://nodejs.org/)
2. Clone or download this repository.
3. Open a command line window and go to the directory which contains the cloned/downloaded web editor files.
4. Configure the web editor by editing `config.js`  to suit your needs.
6. Install the dependencies by executing `npm install` on the command line
7. 
    * Development: Run the development server by executing `npm run serve`.
    * Deployment: Build the project by executing `npm run build`. Afterwards upload the content of the `dist` folder to your server.

## Built With
* [Vue.js](https://vuejs.org/) and some plugins - UI framework
* [OpenLayers](http://openlayers.org/) and multiple extensions - Map visualization
* [CodeMirror](https://codemirror.net/) - Source code editor
* [openEO JS Client](https://github.com/Open-EO/openeo-js-client) - openEO client
* and more...

## License
This project is licensed under the Apache 2.0 license - see the [LICENSE.md](LICENSE.md) file for details.
