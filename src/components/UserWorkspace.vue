<template>
	<Tabs id="userContent" ref="tabs">
		<Tab v-if="supportsJobs" id="jobs" name="Batch Jobs" icon="fa-tasks">
			<JobPanel />
		</Tab>
		<Tab v-if="supportsServices" id="services" name="Web Services" icon="fa-cloud">
			<ServicePanel />
		</Tab>
		<Tab v-if="supportsCustomProcesses" id="customProcesses" name="Custom Processes" icon="fa-code-branch">
			<CustomProcessPanel />
		</Tab>
		<Tab v-if="supportsFiles" id="files" name="Files" icon="fa-file">
			<FilePanel />
		</Tab>
	</Tabs>
</template>

<script>
import Utils from '../utils.js';
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import Tab from '@openeo/vue-components/components/Tab.vue';
import ConnectionMixin from './ConnectionMixin.vue';
import FilePanel from './FilePanel.vue';
import JobPanel from './JobPanel.vue';
import CustomProcessPanel from './CustomProcessPanel.vue';
import ServicePanel from './ServicePanel.vue';

export default {
	name: 'UserWorkspace',
	mixins: [ConnectionMixin],
	components: {
		FilePanel,
		JobPanel,
		CustomProcessPanel,
		ServicePanel,
		Tabs,
		Tab
	},
	computed: {
		supportsJobs() {
			return (this.supports('listJobs') || this.supports('createJob'));
		},
		supportsServices() {
			return (this.supports('listServices') || this.supports('createService'));
		},
		supportsCustomProcesses() {
			return (this.supports('listUserProcesses') || this.supports('setUserProcess'));
		},
		supportsFiles() {
			return (this.supports('listFiles') || this.supports('uploadFile'));
		}
	}
}
</script>

<style>
#userContent {
	margin-top: 1em;
}
#userContent .tabContent {
	padding: 5px;
	height: calc(100% - 12px);
}
</style>