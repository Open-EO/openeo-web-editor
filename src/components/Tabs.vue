<template>
	<div :class="{tabs: true, hide: !hasEnabledTabs, hideNames: hideNames} " :id="id">
		<div class="tabsHeader">
			<button type="button" v-show="tab.enabled" :class="{tabItem: true, tabActive: tab.active }" @click="selectTab(tab)" :title="tab.name" v-for="tab in tabs" :key="tab.id">
				<i v-if="tab.icon" :class="['fas', tab.icon]"></i>
				<span class="tabName">{{ tab.name }}</span>
			</button>
		</div>
		<div class="tabsBody">
			<slot></slot>
		</div>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';

export default {
	name: "Tabs",
	props: {
		id: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			tabs: [],
			hideNames: false
		};
	},
	mounted() {
		if (Array.isArray(this.$children)) {
			this.tabs = this.$children;
			this.resetActiveTab();
		}

		EventBus.$on('resizedIDE', this.onResize);
	},
	computed: {
		hasEnabledTabs() {
			return this.tabs.filter(t => t.enabled).length > 0;
		}
	},
	methods: {
		onResize() {
			try {
				var tabsHeaderWidth = document.getElementById(this.id).getElementsByClassName('tabsHeader')[0].getBoundingClientRect().width;
				this.hideNames = tabsHeaderWidth < this.tabs.length * 75;
			} catch(e) {}
		},
		getTab(id) {
			for (let i in this.tabs) {
				if (this.tabs[i].id == id) {
					return this.tabs[i];
				}
			}
			return null;
		},
		getActiveTab() {
			for (let i in this.tabs) {
				if (this.tabs[i].active) {
					return this.tabs[i];
				}
			}
			return null;
		},
		getActiveTabId() {
			var tab = this.getActiveTab();
			if (tab !== null) {
				return tab.id;
			}
			return null;
		},
		async selectTab(selectedTab) {
			var activeTab = this.getActiveTab();
			if (typeof selectedTab === "string") {
				// Get tab by id
				selectedTab = this.getTab(selectedTab);
			}
			if (activeTab === selectedTab) {
				return;
			}
			if (!selectedTab || typeof selectedTab.show !== 'function') {
				console.warn("Invalid tab", selectedTab);
				return;
			}
			if (await selectedTab.show() && activeTab !== null) {
				activeTab.hide();
			}
		},
		resetActiveTab(force = false) {
			if (this.tabs.length === 0) {
				return;
			}
			if (force || this.getActiveTab() === null) {
				this.selectTab(this.tabs[0]);
			}
		}
	}
};
</script>

<style>
.tabs {
	border-radius: 3px;
	border: 1px solid #aaa;
	display: flex;
	flex-direction: column;
	height: 100%;
}
.tabsHeader {
	display: flex;
	background-color: #f9f9f9;
}
.tabsBody {
	flex-grow: 1;
	overflow: auto;
	height: 100%;
}
.tabs.hide {
	display: none;
}
.tabs .tabName {
	margin-left: 0.25em;
}
.tabs.hideNames .tabName {
	display: none;
}
.tabContent {
	background-color: white;
	border-top: 1px solid #ddd;
	padding-top: 1px;
	height: calc(100% - 2px);
}
.tabContent .dataTable, .tabContent table {
	width: 100%;
	border-collapse: collapse;
}
.tabContent table td,
.tabContent table th {
	border: 1px solid #ddd;
	padding: 3px;
}
.tabItem:first-of-type {
	margin-left: 5px;
}
.tabItem {
	background-color: transparent;
	border: 0;
	margin: 5px 5px 0px 0px;
	padding: 5px 10px;
	border: 1px solid #aaa;
	border-bottom: 0;
	border-radius: 5px 5px 0 0;
	white-space: nowrap;
	color: #666;
	background-color: #eee;
	min-width: 5em;
	text-overflow: ellipsis;
	overflow: hidden;
}
.tabs.hideNames .tabItem {
	min-width: 3em;
}
.tabItem:hover {
	color: black;
}
.tabItem:focus {
	outline: none;
}
div.tabActive {
	display: block;
}
button.tabActive {
	background-color: white;
	color: black;
	margin-bottom: -1px;
}
</style>