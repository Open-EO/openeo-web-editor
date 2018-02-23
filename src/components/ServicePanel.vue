<template>
  <div id="servicePanel">
    <table>
      <tr>
        <th>Type</th>
        <th>Name</th>
        <th>Status</th>
        <th>Action</th>
      </tr>
      <tr>
        <td>WMS</td>
        <td>Germany NDVI WMS</td>
        <td class="active">Active</td>
        <td><button id="deleteService">Delete</button></td>
      </tr>
    </table>
  </div>
</template>

<script>
import EventBus from '../eventbus.js';

export default {
	name: 'ServicePanel',
	data() {
		return {}
	},
	mounted() {

	},
	methods: {
		
	}
}
</script>
