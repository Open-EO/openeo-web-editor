# openEO Web Editor

A web-based editor for interactive usage of the openEO API.

The Web Editor currently **supports openEO API versions v1.0.x** (including 1.0.0-rc.2).

This project is licensed under the Apache 2.0 license - see the [LICENSE.md](LICENSE.md) file for details.

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

### Query Parameters

You can use some query parameters to set initial state to the Editor.

* `server`: Set a openEO back-end to connect to by default, e.g. `https://earthengine.openeo.org`
* `discover`: If you want to skip authentication and just show the capabilities of the back-end, simply set to `1`.
* `process`: Loads a process from a URL and shows it in the Model Builder. You can also pass a single process name with an optional namespace to the parameter (format: `process@namespace`) to simply add a single process node for that process by default.
* `namespaces`: Loads an additional process namespaces. Multiple namespaces can be separated by a comma (e.g. `vector,sar`).
* `edit-node`: Opens the parameter editor for a single process node on start-up. Must have the `process` parameter being set, otherwise will be ignored. You can set two types of values:
  * `1`: If only a single node is being added, opens this node without explicitly naming it.
  * Otherwise, the value must correspond to the node identifier without `#` at the beginning.
* `wizard`: Opens a specific wizard on start-up. The value must correspond to the component name of the wizard. Wizard options can be set by providing them as query parameter prefixed with `wizard~`, e.g., `&wizard~collection=SENTINEL2-L2A`.
  * Usecase "Run UDP": For `wizard=UDP` you can provide a process in the query parameter `wizard~process` which has the same format as in `process` above and will open a wizard for this UDP.
* `preview-collection`: Shows the preview of a Collection on the map upon start.
* `result`: Loads a STAC Item or Collection in "App mode".
* `oidc~prompt`: Set the `prompt` parameter for the [OIDC authentication request](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest). For example: use value `login` to enforce a (re)login with the OIDC provider.

Example: <https://editor.openeo.org?server=https://earthengine.openeo.org&discover=1&process=https://raw.githubusercontent.com/Open-EO/openeo-earthengine-driver/master/tests/data/sample-processgraph.json>

## Implementation guide for back-ends

Here we collect information for back-end implementers that want to improve the experience with the Web Editor by fine-tuning their implementation.

* [GeoTiff / COG support](docs/geotiff.md)
* [OIDC setup](docs/oidc.md)
* and more...

## Contributions

The authors acknowledge the financial support for the development of this package during the H2020 project "openEO" (Oct 2017 to Sept 2020) by the European Union, funded by call EO-2-2017: EO Big Data Shift, under grant number 776242. We also acknowledge the financial support received from ESA for the project "openEO Platform" (Sept 2020 to Sept 2023).

This package received major contributions from the following organizations:

[<img src="https://www.uni-muenster.de/imperia/md/images/allgemein/farbunabhaengig/wwu.svg" alt="WWU Münster logo" title="WWU Münster" height="50">](https://www.uni-muenster.de/) &nbsp;
[<img src="https://www.mundialis.de/wordpress/wp-content/uploads/2015/11/mundialis_logo_web.png" alt="mundialis logo" title="mundialis" height="50">](https://www.mundialis.de)
[<img src="https://www.sinergise.com/sites/default/files/logo.png" alt="Sinergise logo" title="Sinergise" height="50">](https://www.sinergise.com)

## Built with

* [Vue.js](https://vuejs.org/) and some plugins - UI framework
* [OpenLayers](http://openlayers.org/) and multiple extensions - Map visualization
* [CodeMirror](https://codemirror.net/) - Source code editor
* [openEO JS Client](https://github.com/Open-EO/openeo-js-client) - openEO client

## Docker

### Local build
This repository contains a Dockerfile. It can be built with
```
docker build . -t openeo-web-editor
```
and then tested locally with
```
docker run -p 8080:80 openeo-web-editor
```
After successful startup, the webeditor can be reached locally at http://127.0.0.1:8080/

More startup information can be seen at the [official nginx docker image](https://hub.docker.com/_/nginx/) which is used.

### Use image from Dockerhub
The same Docker Image is built and pushed to Dockerhub with the help of a github action. It is available [here](https://hub.docker.com/repository/docker/mundialis/openeo-web-editor).

To use it locally, run
```
docker pull mundialis/openeo-web-editor:latest
```
Then run it with
```
docker run -p 8080:80 mundialis/openeo-web-editor:latest
```
After successful startup, the webeditor can be reached locally at http://127.0.0.1:8080/

To test a certain commit, simply pull the according tag (available from 2021-09-02), e.g.,
```
docker pull mundialis/openeo-web-editor:sha-4636d41
```
The Docker Image is maintained by mundialis.
