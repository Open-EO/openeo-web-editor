<template>
	<Tabs id="userContent" ref="tabs">
		<Tab v-if="showJobs" id="jobs" name="Batch Jobs" icon="fa-tasks" @show="onShow" @hide="onHide">
			<JobPanel />
		</Tab>
		<Tab v-if="showServices" id="services" name="Web Services" icon="fa-cloud" @show="onShow" @hide="onHide">
			<ServicePanel />
		</Tab>
		<Tab v-if="showCustomProcesses" id="customProcesses" name="Custom Processes" icon="fa-sitemap" @show="onShow" @hide="onHide">
			<CustomProcessPanel />
		</Tab>
		<Tab v-if="showFiles" id="files" name="Files" icon="fa-file" @show="onShow" @hide="onHide">
			<FilePanel />
		</Tab>
	</Tabs>
</template>

<script>
import Utils from '../utils.js';
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import Tab from '@openeo/vue-components/components/Tab.vue';
import FilePanel from './FilePanel.vue';
import JobPanel from './JobPanel.vue';
import CustomProcessPanel from './CustomProcessPanel.vue';
import ServicePanel from './ServicePanel.vue';

export default {
	name: 'UserWorkspace',
	components: {
		FilePanel,
		JobPanel,
		CustomProcessPanel,
		ServicePanel,
		Tabs,
		Tab
	},
	computed: {
		...Utils.mapGetters(['supports']),
		showJobs() {
			return (this.supports('listJobs') || this.supports('createJob'));
		},
		showServices() {
			return (this.supports('listServices') || this.supports('createService'));
		},
		showCustomProcesses() {
			return (this.supports('listUserProcesses') || this.supports('setUserProcess'));
		},
		showFiles() {
			return (this.supports('listFiles') || this.supports('uploadFile'));
		}
	},
	methods: {
		onShow(tab) {
			if (tab.$children.length && typeof tab.$children[0].onShow === 'function') {
				tab.$children[0].onShow();
			}
		},
		onHide(tab) {
			if (tab.$children.length && typeof tab.$children[0].onHide === 'function') {
				tab.$children[0].onHide();
			}
		}
	}
}
</script>

<style>
#userContent .tabContent {
	padding: 5px;
	height: calc(100% - 12px);
}
#userContent .data-table .title {
	word-break: break-all;
}
</style>