<template>
  <div id="filePanel">
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
  	name: 'FilePanel',
  	methods: {
	  sizeFormatter(value, rowProperties) {
		var i = value == 0 ? 0 : Math.floor( Math.log(value) / Math.log(1024) );
		return ( value / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
	  }
  }
}
</script>
