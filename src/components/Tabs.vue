<template>
	<div class="tabs" :id="id">
		<div class="tabsHeader">
			<button type="button" v-show="tab.enabled" :class="{'tabItem': true, 'tabActive': tab.active }" @click="selectTab(tab)" v-for="tab in tabs" :key="tab.id">
				<i :class="['fas', tab.icon]"></i> {{ tab.name }}
			</button>
		</div>
		<div class="tabsBody">
			<slot></slot>
		</div>
	</div>
</template>

<script>
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
			tabs: []
		};
	},
	created() {
		this.tabs = this.$children;
	},
	mounted() {
		this.resetActiveTab();
	},
	methods: {
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
			if (selectedTab !== null && await selectedTab.show() && activeTab !== null) {
				activeTab.hide();
			}
		},
		resetActiveTab(force = false) {
			if (force || this.getActiveTab() === null) {
				this.selectTab(this.tabs[0]);
			}
		}
	}
};
</script>

<style>
.tabContent {
	background-color: white;
	border-top: 1px solid #ddd;
	overflow: auto;
	padding-top: 1px;
}
.tabs {
	border-radius: 3px;
	border: 1px solid #aaa;
	margin-bottom: 10px;
}
#viewer .tabs {
	height: 97%;
}
#viewer .tabsBody,
#viewer .tabContent {
	height: calc(98% - 1em + 16px);
}
.tabsHeader {
	background-color: #f9f9f9;
}
#userContent .tabContent {
	padding: 5px;
	min-height: 200px;
	max-height: 350px;
}
.tabContent table {
	width: 100%;
	border-collapse: collapse;
}
.tabContent table td,
.tabContent table th {
	border: 1px solid #ddd;
	padding: 3px;
}
.tabsHeader {
	display: flex;
}
#processGraphContent .tabsHeader {
	display: flex;
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