<template>
	<div id="filePanel" class="dataPanel">
		<h3>User '{{ userName }}'</h3>
		<template v-if="me.storage">
			<h4>Storage</h4>
			<div class="percent"><div class="used" :style="'width: ' + this.storageUsedPercent + '%'"></div></div>
			<div>Used {{ formatMegabyte(this.storageUsed) }} of {{ formatMegabyte(this.me.storage.quota) }}.</div>
		</template>
		<template v-if="typeof me.budget === 'number' && me.budget >= 0">
			<h4>Budget</h4>
			{{ formatCurrency(me.budget) }}
		</template>
		<template v-if="Array.isArray(me.links) && me.links.length > 0">
			<h4>Additional resources</h4>
			<LinkList :links="me.links" />
		</template>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';
import WorkPanelMixin from './WorkPanelMixin.vue';
import LinkList from '@openeo/vue-components/components/LinkList.vue';

export default {
	name: 'AccountPanel',
	mixins: [WorkPanelMixin],
	components: {
		LinkList
	},
	data() {
		return {
			me: {}
		}
	},
	computed: {
		userName: {
			get() {
				if (!this.userId) {
					return 'Guest';
				}
				else {
					return this.userId;
				}
			}
		},
		storageUsed: {
			get() {
				if (!this.$utils.isObject(this.me.storage)) {
					return null;
				}
				return this.me.storage.quota - this.me.storage.free;
			}
		},
		storageUsedPercent: {
			get() {
				if (!this.$utils.isObject(this.me.storage)) {
					return null;
				}
				return Math.round(this.storageUsed / this.me.storage.quota * 100);
			}
		},
	},
	methods: {
		updateData() {
			if (!this.connection) {
				return;
			}

			if (this.supports('describeAccount') && this.userId) {
				this.connection.describeAccount()
					.then(data => this.me = data)
					.catch(error => {
						this.$utils.exception(this, error, "Sorry, could not load account information.");
					});
			}
		},
		formatMegabyte(num) {
			return Math.round(num/(1024*1024)) + ' MB'
		},
		formatCurrency(num) {
			var currency = '';
			if (this.connection && this.connection.capabilitiesObject && this.connection.capabilitiesObject.currency() !== null) {
				currency = ' ' + this.connection.capabilitiesObject.currency();
			}
			return num + currency;
		}
	}
}
</script>

<style scoped>
h4 {
	margin: 1em 0 0.3em 0;
}
.percent {
	background-color: green;
	width: 50%;
	height: 1em;
}
.percent .used {
	background-color: maroon;
	width: 1px;
	height: 1em;
}
</style>
