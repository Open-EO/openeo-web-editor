<template>
	<div id="filePanel">
		<h3>User '{{ userName }}'</h3>
		<br>
		<ul>
			<li v-if="openEO.Capabilities.userCredits()">Credits: {{ credits === null ? 'N/A' : credits }} <button id="topUpCredits" v-if="credits !== null" @click="topUpCredits">Top up</button></li>
		</ul>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';
import DataTable from './DataTable.vue';

export default {
	name: 'FilePanel',
	props: ['openEO','userId'],
	components: {
		DataTable
	},
	data() {
		return {
			credits: null
		}
	},
	created() {
		EventBus.$on('serverChanged', this.updateData);
	},
	watch: { 
		userId(newVal, oldVal) {
			if (newVal !== null) {
				this.updateData();
			}
		}
	},
	computed: {
		userName: {
			get() {
				if ((typeof this.userId !== 'string' && typeof this.userId !== 'number') || this.userId == 'me') {
					return 'Guest';
				}
				else {
					return this.userId;
				}
			}
		}
	},
	methods: {
		updateData() {
			this.credits = null;
			if (typeof this.userId !== 'string' && typeof this.userId !== 'number') {
				return;
			}

			if (this.openEO.Capabilities.userCredits()) {
				let user = this.openEO.Users.getObject(this.userId);
				user.getCredits()
					.then(data => {this.credits = data})
					.catch(error => {this.credits = null; });
			}
		},
		topUpCredits() {
			this.$utils.error(this, 'Not implemented!');
		}
	}
}
</script>