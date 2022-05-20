# openEO Web Editor
A web-based editor for interactive usage of the openEO API.

The Web Editor currently **supports openEO API versions v1.0.x** (including 1.0.0-rc.2).

## Getting Started

The Web Editor is available at [editor.openeo.org](https://editor.openeo.org) for demo purposes.

You can also build the files yourself and deploy them to any web host:

1. Install [Node.js](https://nodejs.org/)
2. Clone or download this repository.
3. Open a command line window and go to the directory which contains the cloned/downloaded web editor files.
4. Configure the web editor by editing `config.js`, `vue.config.js` and `theme.scss` to suit your needs.
6. Install the dependencies by executing `npm install` on the command line
7. For...
    * Development: Run the development server by executing `npm start`.
    * Deployment: Build the project by executing `npm run build`. Afterwards upload the content of the `dist` folder to your server.

### Breaking changes

* Please note that in v0.9.8 and v0.9.9 the config file structure has changed slightly.
  You need to add the new `basemaps` property to your config file. Otherwise, you won't see a basemap any more.

### Query Parameters

You can use some query parameters to set initial state to the Editor.

* `server`: Set a openEO back-end to connect to by default, e.g. `https://earthengine.openeo.org`
* `discover`: If you want to skip authentication and just show the capabiltiies of the back-end, simply set to `1`.
* `process`: Loads a process from a URL and shows it in the Model Builder. You can also pass a single process name with an optional namespace to the parameter (format: `process@namespace`) to simply add a single process node for that process by default.
* `namespaces`: Loads a additional process namespaces. Multiple namespaces can be separated by a comma (e.g. `vector,sar`).
* `edit-node`: Opens the parameter editor for a single process node on start-up. Must have the `process` parameter being set, otherwise will be ignored. You can set two types of values:
  * `1`: If only a single node is being added, opens this node without explicitly naming it.
  * Otherwise, the value must correspond to the node identifier without `#` at the beginning.
* `preview-collection` Shows the preview of a Collection on the map upon start.

Example: <https://editor.openeo.org?server=https://earthengine.openeo.org&discover=1&process=https://raw.githubusercontent.com/Open-EO/openeo-earthengine-driver/master/tests/data/sample-processgraph.json>

## Built With
* [Vue.js](https://vuejs.org/) and some plugins - UI framework
* [OpenLayers](http://openlayers.org/) and multiple extensions - Map visualization
* [CodeMirror](https://codemirror.net/) - Source code editor
* [openEO JS Client](https://github.com/Open-EO/openeo-js-client) - openEO client
* and more...

## License
This project is licensed under the Apache 2.0 license - see the [LICENSE.md](LICENSE.md) file for details.

## Docker

### Local build
This repository contains a Dockerfile. It can be build with
```
docker build . -t openeo-web-editor
```
and then tested locally with
```
docker run -p 8080:80 openeo-web-editor
```
After sucessfull startup, the webeditor can be reached locally at http://127.0.0.1:8080/

More startup information can be seen at the [official nginx docker image](https://hub.docker.com/_/nginx/) which is used.

### Use image from Dockerhub
The same Dockerimage is build and pushed to Dockerhub with the help of a github action. It is available [here](https://hub.docker.com/repository/docker/mundialis/openeo-web-editor).

To use it locally, run
```
docker pull mundialis/openeo-web-editor:latest
```
Then run it with
```
docker run -p 8080:80 mundialis/openeo-web-editor:latest
```
After sucessfull startup, the webeditor can be reached locally at http://127.0.0.1:8080/

To test a certain commit, simply pull the according tag (available from 2021-09-02), e.g.
```
docker pull mundialis/openeo-web-editor:sha-4636d41
```
The Dockerimage is maintained by mundialis.

## Implementation guide for back-ends

Here we collection information for back-end implementors that want to improve the experience with the Web Editor by fine-tuning their implementation.

* [GeoTiff / COG support](docs/geotiff.md)