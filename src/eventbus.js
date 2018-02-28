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

## evalScript(callback $callback, boolean selected = true)
Triggers the script currently in the editor to be evaluated runs the callback using the data from the evaluation.
Might only run on the selected part of the script.

## jobCreated(object $data)
Triggered when a job was created successfully.

*/
export default new Vue();