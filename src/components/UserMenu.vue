<template>
	<div id="UserMenu">
		<div class="menuItem">
			<div class="down">
				<i class="fas fa-chevron-down"></i>
			</div>
			<div class="data">
				<span class="name nowrap"><i class="fas fa-user"></i> {{ userName }}</span>
				<span v-if="budget" class="credits nowrap"><i class="fas fa-dollar-sign fa-fw"></i> {{ budget }}</span>
				<span v-if="hasStorage" class="storage nowrap"><i class="fas fa-database fa-fw"></i> {{ storageUsedPercent }}% used</span>
			</div>
		</div>
		<div class="dropdown">
			<div class="item">
				Welcome, {{ userName }}!
			</div>
			<div class="item" v-if="hasStorage">
				<h4>Storage</h4>
				<div class="storagePercent"><div class="used" :style="'width: ' + storageUsedPercent + '%'"></div></div>
				<div class="nowrap">Used {{ formatMegabyte(storageUsed) }} of {{ formatMegabyte(userInfo.storage.quota) }}.</div>
			</div>
			<div class="item" v-for="(link, key) in links" :key="key">
				<a :href="link.href" target="_blank" :rel="link.rel">{{ link.title }}</a>
			</div>
			<div class="item">
				<button v-if="!isAuthenticated" class="navButton" type="button" @click.prevent="login"><i class="fas fa-sign-in-alt"></i> Login</button>
				<button v-else class="navButton" type="button" @click.prevent="logout"><i class="fas fa-sign-out-alt"></i> Logout</button>
				<button v-if="!$config.serverUrl" class="navButton" type="button" @click.prevent="disconnect"><i class="fas fa-sign-out-alt"></i> Disconnect</button>
			</div>
		</div>
	</div>
</template>

<script>
import Utils from '../utils.js';

export default {
	name: 'UserMenu',
	computed: {
		...Utils.mapState(['userInfo', 'isAuthenticated']),
		...Utils.mapGetters(['currency']),
		links() {
			return Utils.friendlyLinks(this.userInfo.links);
		},
		hasStorage() {
			return Utils.isObject(this.userInfo.storage) && typeof this.userInfo.storage.quota === 'number' && typeof this.userInfo.storage.free === 'number';
		},
		budget() {
			return Utils.formatBudget(this.userInfo.budget, this.currency);
		},
		userName() {
			if (typeof this.userInfo.name === 'string') {
				return this.userInfo.name;
			}
			else if (typeof this.userInfo.user_id === 'string') {
				return this.userInfo.user_id;
			}
			else if (this.isAuthenticated) {
				return 'User';
			}
			else {
				return 'Guest';
			}
		},
		storageUsed() {
			if (!this.hasStorage) {
				return null;
			}
			return this.userInfo.storage.quota - this.userInfo.storage.free;
		},
		storageUsedPercent() {
			if (!this.hasStorage) {
				return null;
			}
			return Math.round(this.storageUsed / this.userInfo.storage.quota * 100);
		}
	},
	methods: {
		...Utils.mapActions({logoutUser: 'logout'}),
		...Utils.mapMutations('editor', {resetEditor: 'reset'}),
		...Utils.mapMutations(['discoveryCompleted']),
		async logout() {
			await this.logoutUser(false);
			Utils.ok(this, 'Logout successful.');
		},
		async disconnect() {
			await this.logoutUser(true);
			this.resetEditor();
			window.history.pushState({}, "", "?");
		},
		login() {
			this.discoveryCompleted(false);
		},
		formatMegabyte(num) {
			var gb = 1024*1024*1024;
			if (num > gb) {
				return Math.round(num/gb) + ' GB';
			}
			else {
				return Math.round(num/(1024*1024)) + ' MB';
			}
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
.name {
	max-width: 250px;
    text-overflow: ellipsis;
    overflow: hidden;
}
.credits, .storage {
	margin-top: 3px;
	font-size: 12px;
	font-weight: normal;
}
.storagePercent {
	background-color: green;
	height: 1em;
	border-radius: 0.3em;
}
.storagePercent .used {
	background-color: maroon;
	width: 1px;
	height: 1em;
	border-radius: 0.3em;
}
.nowrap {
	white-space: nowrap;
}
h4 {
	margin: 0 0 10px 0;
}
</style>
