<template>
  <div id="filePanel">
    <h3>Files</h3>
    <table>
      <tr>
        <th>Name</th>
        <th>Size</th>
        <th>Last modification</th>
        <th>Action</th>
      </tr>
      <tr>
        <td>test.json</td>
        <td>12 kB</td>
        <td>2018-01-02 12:55:55</td>
        <td><button id="deleteFile">Delete</button></td>
      </tr>
    </table>
  </div>
</template>

<script>
import EventBus from '../eventbus.js';

export default {
  name: 'FilePanel'
}
</script>
