<template>
	<div id="filePanel">
		<h3>Account</h3>
		<ul>
			<li>User Name: Guest</li>
			<li>Credits: 0 <button id="topUpCredits">Top up</button></li>
		</ul>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';

export default {
	name: 'FilePanel',
	data() {
		return {}
	},
	mounted() {

	},
	methods: {
		
	}
}
</script>