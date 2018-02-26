<template>
	<div id="filePanel">
		<h3>User '{{ userName }}'</h3>
		<br>
		<ul>
			<li>Credits: {{ credits === null ? 'N/A' : credits }} <button id="topUpCredits" v-if="credits !== null">Top up</button></li>
		</ul>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';
import DataTable from './DataTable.vue';

export default {
	name: 'FilePanel',
	props: ['userId'],
	components: {
		DataTable
	},
	data() {
		return {
			credits: null
		}
	},
	mounted() {
	},
	watch: { 
		userId(newVal, oldVal) {
			this.updateData();
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

			let user = this.$OpenEO.Users.getObject(this.userId);
			user.getCredits()
				.then(data => {this.credits = data.credits})
				.catch(errorCode => {this.credits = null; });
		}
	}
}
</script>