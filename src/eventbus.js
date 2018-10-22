import Vue from 'vue';

/*
# Events

## changeServerUrl(string $url)
Fired when the server URL has been changed in the front-end and needs to update the model.

## serverChanged()
The server has changed and the UI should be updated.

## addCollectionToEditor(string $code)
Adds the collection to the editor.

## addProcessToEditor(string $code)
Adds the process to the editor.

## addSourceCode(string $code, boolean $replace = false)
Adds the code to the source code editor.

## viewWebService(object $service)
Shows a web service on the map.

## removeWebService(string $id)
Removes a web service from the map.

## getProcessGraph(callback $callback)
Triggers the script/model currently in the editor to be evaluated runs the callback using the data from the evaluation.

## getVisualization(callback $callback)
Get the visualization script from the editor.

## jobCreated(object $data)
Triggered when a job was created successfully.

## closeModal()
Closes the modal

## modalClosed()
A modal has been closed, which might be of relevance to its subcomponents (they may treat this as a "cancel")

## serviceCreated(object $data)
Triggered when a service was created successfully.

## showModal(string $title, string $contents)
Shows a modal with the specified title and contents.
If $content is a string, it is treated as raw text, so HTML in it will NOT be rendered.
If $content object is an object, it is rendered as a more readable list via the ObjectTree component.
The last case is a shorthand for showComponentModal($title, 'ObjectTree', {data: $data})

## showComponentModal(string $title, string $compname, object $props)
Shows a modal with the specified title and an instance of the $compname component.
The component can be supplied with props by passing them as an object with the props' names as the keys and the props' contents as the values, e.g. {propname1: 'content', propname2: {foo: 'bar'}}
The component to be used must be known (i.e. imported and declared) in the Modal component.

## showInViewer(Blob $blob, object $script, object $output_args)
Shows the data with the specified content type in the appropriate area of the viewer.
The script can be specified if any visualization should be applied.
Also to enhance viewing experience the "original" output format arguments can be given.

## showMapViewer()
Shows the map in the viewer area.

## showImageViewer()
Shows the image panel in the viewer area.

## showMapDataViewer()
Shows the data panel in the viewer area.

## propagateCollections(object $data)
Forwards new collection data from BackendPanel to GraphBuilderEnvironment

## propagateProcesses(object $data)
Forwards new process data from BackendPanel to GraphBuilderEnvironment

*/
export default new Vue();