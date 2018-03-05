import Vue from 'vue';

/*
# Events

## changeServerUrl(string $url)
Fired when the server URL has been changed in the front-end and needs to update the model.

## serverChanged()
The server has changed and the UI should be updated.

## addToSource(string $code)
Adds the code to the source code editor.

## updateMapTilesWithUrl(string $url)
might change later...

## evalScript(callback $callback)
Triggers the script currently in the editor to be evaluated runs the callback using the data from the evaluation.

## jobCreated(object $data)
Triggered when a job was created successfully.

## serviceCreated(object $data)
Triggered when a service was created successfully.

## showModal(string $title, $body)
Shows a modal with the specified title and body contents. Body can be a string or an object. Objects are converted to a more readable list.

## showInViewer(Blob $blob)
Shows the data with the specified content type in the appropriate area of the viewer.

## showMapViewer()
Shows the map in the viewer area.

## showImageViewer()
Shows the image panel in the viewer area.

## showMapDataViewer()
Shows the data panel in the viewer area.

*/
export default new Vue();