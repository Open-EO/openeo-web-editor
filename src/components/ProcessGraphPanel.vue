<template>
  <div id="processGraphPanel">
    <table>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>Action</th>
      </tr>
      <tr>
        <td>1</td>
        <td>test</td>
        <td><button id="replaceProcessGraph">Replace</button> <button id="deleteProcessGraph">Delete</button></td>
      </tr>
    </table>
  </div>
</template>

<script>
import EventBus from '../eventbus.js';

export default {
	name: 'ProcessGraphPanel',
	data() {
		return {}
	},
	mounted() {

	},
	methods: {
		
	}
}
</script>