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
				<div class="storagePercent"><div class="used" :style="'width: ' + storageUsedPercent + '%'"></div></div>
				<div class="nowrap">Used {{ formatMegabyte(storageUsed) }} of {{ formatMegabyte(userInfo.storage.quota) }}.</div>
			</div>
			<div class="item" v-for="(link, key) in links" :key="key">
				<a :href="link.href" target="_blank" :rel="link.rel">{{ link.title }}</a>
			</div>
			<div class="item">
				<button class="navButton" type="button" @click.prevent="logout()"><i class="fas fa-sign-out-alt"></i> Logout</button>
			</div>
		</div>
	</div>
</template>

<script>
import Utils from '../utils.js';

export default {
	name: 'UserMenu',
	computed: {
		...Utils.mapState('server', ['userInfo', 'userId']),
		...Utils.mapGetters('server', ['formatCurrency']),
		links() {
			var links = [];
			if (Array.isArray(this.userInfo.links)) {
				for(var i in this.userInfo.links) {
					var link = this.userInfo.links[i];
					if (typeof link.rel === 'string' && link.rel.toLowerCase() === 'self') {
						continue;
					}
					if (typeof link.title !== 'string' || link.title.length === 0) {
						if (typeof link.rel === 'string' && link.rel.length > 1) {
							link.title = link.rel.charAt(0).toUpperCase() + link.rel.slice(1);
						}
						else {
							link.title = link.href.replace(/^https?:\/\/(www.)?/i, '').replace(/\/$/i, '');
						}
					}
					links.push(link);
				}
			}
			return links.sort((a, b) => a.title.localeCompare(b.title));
		},
		hasBudget() {
			return this.userInfo.budget === null || (typeof this.userInfo.budget === 'number' && this.userInfo.budget >= 0);
		},
		hasStorage() {
			return Utils.isObject(this.userInfo.storage) && typeof this.userInfo.storage.quota === 'number' && typeof this.userInfo.storage.free === 'number';
		},
		budget() {
			if (this.hasBudget) {
				if (this.userInfo.budget === null) {
					return "Unlimited";
				}
				else {
					return this.formatCurrency(this.userInfo.budget);
				}
			}
			else {
				return "N/A";
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
		...Utils.mapMutations('server', {resetServer: 'reset'}),
		...Utils.mapMutations('editor', {resetEditor: 'reset'}),
		logout() {
			this.resetServer();
			this.resetEditor();
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
