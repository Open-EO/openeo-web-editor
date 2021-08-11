# Events

## Custom Processes

### editProcess(object $resource)
Sends the current custom process and inserts it into the currently active editor.

## Modals

### showModal(component, props, events, id = null)

### hideModal(modal)

### showListModal(string $title, array $list, array $listActions)
Shows a list in a modal.

### showWebEditorInfo()
Showa information about the web editor in a modal.

### showCollection(id)
Shows collection information in a modal.

### showProcess(process)
Shows process information in a modal.

## Viewer & Web Services

### viewBlob(Blob $data, $title = null)
Shows the Blob object in the viewer.

### viewLink(Object $data, $title = null)
Shows the link in the viewer. A link object must contain href and type properties and may contain a title.

### viewSyncResult(object $process)
Executes the custom process and shows the result.

### viewJobResults(object $jobResult, object $job = null)
Shows data from a job result document.

### viewWebService(object $service)
Shows a web service on the map.

### removeWebService(string $id)
Removes a web service from the map.

## UI

### windowResized()
The panels or the browser window have been resized.