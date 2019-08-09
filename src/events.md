# Events

## Process Graphs

### getProcessGraph(callback $success, callback, callback $failure = null, boolean $passNull = false)
Passes the process graph currently in the editor to the $success callback. If $failure is specified, an error or exception is passed to the callback. Otherwise shows the message in the notification center. $passNull set to true considers null a success and passes it to the corresponding callback.
$success has one parameter: object processGraph
$failure has two parameters: string message, object $exception = null

### insertProcessGraph(object $pg)
Sends the current process graph and inserts it into the currently active editor.

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

### showProcessInfo(id)
Shows process information in a modal.

## Viewer & Web Services

### showViewer(Blob $blob, object $output_args)
Shows the data with the specified content type in the appropriate area of the viewer.
To enhance viewing experience the "original" output format arguments can be given.

### showWebService(object $service)
Shows a web service on the map.

### removeWebService(string $id)
Removes a web service from the map.

## UI

### resizedIDE()
The panels or the browser window have been resized.