<template>
	<div id="UserMenu">
		<div class="menuItem">
			<div class="down">
				<i class="fas fa-chevron-down"></i>
			</div>
			<div class="data">
				<span class="name nowrap"><i class="fas fa-user"></i> {{ userName }}</span>
				<span v-if="hasBudget" class="credits nowrap"><i class="fas fa-dollar-sign fa-fw"></i> {{ budget }}</span>
				<span v-if="hasStorage" class="storage nowrap"><i class="fas fa-database fa-fw"></i> {{ storageUsedPercent }}% used</span>
			</div>
		</div>
		<div class="dropdown">
			<div class="item">
				Welcome, {{ userName }}!
			</div>
			<div class="item" v-if="hasStorage">
				<h4>Storage</h4>
				<div class="storagePercent"><div class="used" :style="'width: ' + this.storageUsedPercent + '%'"></div></div>
				<div class="nowrap">Used {{ formatMegabyte(this.storageUsed) }} of {{ formatMegabyte(this.me.storage.quota) }}.</div>
			</div>
			<div class="item" v-if="Array.isArray(me.links) && me.links.length > 0">
				<h4>Additional resources</h4>
				<LinkList :links="me.links" />
			</div>
			<div class="item">
				<button class="navButton" type="button" @click.prevent="reset()"><i class="fas fa-sign-out-alt"></i> Logout</button>
			</div>
		</div>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';
import WorkPanelMixin from './WorkPanelMixin.vue';
import LinkList from '@openeo/vue-components/components/LinkList.vue';
import Utils from '../utils.js';

export default {
	name: 'UserMenu',
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
		hasBudget() {
			return typeof this.me.budget === 'number' && this.me.budget >= 0;
		},
		hasStorage() {
			return Utils.isObject(this.me.storage) && typeof this.me.storage.quota === 'number' && typeof this.me.storage.free === 'number';
		},
		budget() {
			if (this.hasBudget) {
				return this.formatCurrency(this.me.budget);
			}
			else {
				return "Unknown";
			}
		},
		userName() {
			if (!this.userId) {
				return 'Guest';
			}
			else {
				return this.userId;
			}
		},
		storageUsed() {
			if (!this.hasStorage) {
				return null;
			}
			return this.me.storage.quota - this.me.storage.free;
		},
		storageUsedPercent() {
			if (!this.hasStorage) {
				return null;
			}
			return Math.round(this.storageUsed / this.me.storage.quota * 100);
		}
	},
	methods: {
		...Utils.mapMutations('server', ['reset']),

		updateData() {
			if (!this.connection) {
				return;
			}

			if (this.supports('describeAccount') && this.userId) {
				this.connection.describeAccount()
					.then(data => this.me = data)
					.catch(error => {
						Utils.exception(this, error, "Sorry, could not load account information.");
					});
			}
		},
		formatMegabyte(num) {
			var gb = 1024*1024*1024;
			if (num > gb) {
				return Math.round(num/gb) + ' GB';
			}
			else {
				return Math.round(num/(1024*1024)) + ' MB';
			}
		},
		formatCurrency(num) {
			var currency = '';
			if (this.connection && this.connection.capabilities().currency() !== null) {
				currency = ' ' + this.connection.capabilities().currency();
			}
			return num + currency;
		}
	}
}
</script>

<style scoped>
.down {
	width: 1em;
	padding-right: 10px;
}
.name, .credits, .storage {
	display: block;
}
.credits, .storage {
	margin-top: 3px;
	font-size: 12px;
	font-weight: normal;
}
.storagePercent {
	background-color: green;
	height: 1em;
}
.storagePercent .used {
	background-color: maroon;
	width: 1px;
	height: 1em;
}
.nowrap {
	white-space: nowrap;
}
h4 {
	margin: 0 0 10px 0;
}
</style>
