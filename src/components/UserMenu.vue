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
			<a v-if="profileLink" class="item" :href="profileLink.href" target="_blank">Welcome, {{ userName }}!</a>
			<div v-else class="item">Welcome, {{ userName }}!</div>
			<template v-if="isAuthenticated">
				<a v-if="hasProfile" class="item" @click.prevent="userDetails"><i class="fas fa-user"></i> Profile</a>
				<a v-if="settingsLink" class="item" :href="settingsLink.href" target="_blank"><i class="fas fa-user-edit"></i> {{ settingsLink.title || 'Edit Profile' }}</a>
				<a class="item" @click.prevent="logout"><i class="fas fa-sign-out-alt"></i> Logout</a>
			</template>
			<template v-else>
				<a class="item" @click.prevent="login"><i class="fas fa-sign-in-alt"></i> Login</a>
				<a v-if="registerLink" class="item" :href="registerLink.href" target="_blank"><i class="fas fa-user-plus"></i> Register</a>
				<a v-if="passwordLink" class="item" :href="passwordLink.href" target="_blank"><i class="fas fa-key"></i>  Forgotten Password?</a>
			</template>
			<a v-if="!$config.serverUrl" class="item" @click.prevent="disconnect"><i class="fas fa-sign-out-alt"></i> Disconnect</a>
			<template v-if="userLinks.length > 0">
				<hr />
				<a v-for="(link, key) in userLinks" :key="key" :href="link.href" target="_blank" class="item" :rel="link.rel">{{ link.title }}</a>
			</template>
			<template v-if="budget || userInfo.default_plan || paymentLink">
				<hr />
				<div class="item">
					<h4>Billing</h4>
					<div v-if="userInfo.default_plan" class="secondary-text">Plan: {{ userInfo.default_plan }}</div>
					<div v-if="budget" class="secondary-text">Budget: {{ budget }}</div>
				</div>
				<a v-if="paymentLink" :href="paymentLink.href" class="item" target="_blank"><i class="fas fa-credit-card"></i> {{ paymentLink.title || 'Recharge' }}</a>
			</template>
			<template v-if="hasStorage">
				<hr />
				<div class="item">
					<h4>Storage</h4>
					<div class="secondary-text nowrap">Used {{ formatMegabyte(storageUsed) }} of {{ formatMegabyte(userInfo.storage.quota) }}.</div>
					<div class="storagePercent"><div class="used" :style="'width: ' + storageUsedPercent + '%'"></div></div>
				</div>
			</template>
		</div>
	</div>
</template>

<script>
import EventBusMixin from './EventBusMixin.vue';
import Utils from '../utils.js';

export default {
	name: 'UserMenu',
	mixins: [EventBusMixin],
	computed: {
		...Utils.mapState(['userInfo', 'isAuthenticated']),
		...Utils.mapGetters(['currency', 'capabilities']),
		userLinks() {
			return Utils.friendlyLinks(this.userInfo.links, true, ['self', 'edit-form', 'payment', 'alternate']);
		},
		serverLinks() {
			return this.capabilities ? this.capabilities.links() : [];
		},
		registerLink() {
			return this.serverLinks.find(link => link.rel === 'create-form');
		},
		passwordLink() {
			return this.serverLinks.find(link => link.rel === 'recovery-form');
		},
		settingsLink() {
			return Array.isArray(this.userInfo.links) ? this.userInfo.links.find(link => link.rel === 'edit-form') : undefined;
		},
		paymentLink() {
			return Array.isArray(this.userInfo.links) ? this.userInfo.links.find(link => link.rel === 'payment') : undefined;
		},
		profileLink() {
			return Array.isArray(this.userInfo.links) ? this.userInfo.links.find(link => link.rel === 'alternate') : undefined;
		},
		hasStorage() {
			return Utils.isObject(this.userInfo.storage) && typeof this.userInfo.storage.quota === 'number' && typeof this.userInfo.storage.free === 'number';
		},
		budget() {
			return Utils.formatBudget(this.userInfo.budget, this.currency);
		},
		profile() {
			return Utils.omitFromObject(this.userInfo, ["budget", "links", "storage", "default_plan"]);
		},
		hasProfile() {
			return Utils.size(this.profile) > 0;
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
			this.emit('showLogin');
		},
		userDetails() {
			this.emit('showDataModal', this.profile, "User Profile");
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

<style lang="scss" scoped>
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

	.used {
		background-color: maroon;
		width: 1px;
		height: 1em;
		border-radius: 0.3em;
	}
}
.secondary-text {
	font-size: 0.9em;
	line-height: 1.8em;
	color: #555;
}
.nowrap {
	white-space: nowrap;
}
h4 {
	margin: 0 0 10px 0;
}
.navButton {
	display: block;
	text-align: left;
}
</style>
