<template>
  <div id="jobPanel">
    <h3>Jobs</h3>
    <table>
      <tr>
        <th>#</th>
        <th>Name</th>
        <th>Status</th>
        <th>Action</th>
      </tr>
      <tr>
        <td>1</td>
        <td>test</td>
        <td class="running">Running</td>
        <td><button id="logsJob">Logs</button> <button id="replaceJob">Replace</button> <button id="cancelJob">Cancel</button></td>
      </tr>
    </table>
  </div>
</template>

<script>
import EventBus from '../eventbus.js';

export default {
	name: 'JobPanel',
	data() {
		return {}
	},
	mounted() {

	},
	methods: {
		
	}
}
</script>
