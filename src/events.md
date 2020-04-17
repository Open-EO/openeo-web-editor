# Events

## Custom Processes

### getCustomProcess(callback $success, callback, callback $failure = null, boolean $passNull = false)
Passes the custom process currently in the editor to the $success callback. If $failure is specified, an error or exception is passed to the callback. Otherwise shows the message in the notification center. $passNull set to true considers null a success and passes it to the corresponding callback.
$success has one parameter: object process
$failure has two parameters: string message, object $exception = null

### editProcess(object $resource)
Sends the current custom process and inserts it into the currently active editor.

## Modals

## showMessageModal(string $title, string $message)
Sh#ows a simple text message in a modal.

### showHtmlModal(string $title, string $html)
Shows rendered HTML in a modal.

### showListModal(string $title, array $list, array $listActions)
Shows a list in a modal.

### showWebEditorInfo()
Showa information about the web editor in a modal.

### showCollectionInfo(id)
Shows collection information in a modal.

### showProcessInfoById(id)
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