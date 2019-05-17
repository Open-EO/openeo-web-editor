<template>
	<Tabs id="userContent" ref="tabs" v-show="isConnected">
		<Tab v-if="supportsJobs" id="jobs" name="Batch Jobs" icon="fa-tasks">
			<template v-slot:tab>
				<JobPanel />
			</template>
		</Tab>
		<Tab v-if="supportsServices" id="services" name="Web Services" icon="fa-cloud">
			<template v-slot:tab>
				<ServicePanel />
			</template>
		</Tab>
		<Tab v-if="supportsProcessGraphs" id="storedProcessGraphs" name="Process Graphs" icon="fa-code-branch">
			<template v-slot:tab>
				<ProcessGraphPanel />
			</template>
		</Tab>
		<Tab v-if="supportsFiles" id="files" name="Files" icon="fa-file">
			<template v-slot:tab>
				<FilePanel />
			</template>
		</Tab>
	</Tabs>
</template>

<script>
import EventBus from '../eventbus.js';
import Utils from '../utils.js';
import Tabs from './Tabs.vue';
import Tab from './Tab.vue';
import ConnectionMixin from './ConnectionMixin.vue';
import FilePanel from './FilePanel.vue';
import JobPanel from './JobPanel.vue';
import ProcessGraphPanel from './ProcessGraphPanel.vue';
import ServicePanel from './ServicePanel.vue';

export default {
	name: 'UserWorkspace',
	mixins: [ConnectionMixin],
	components: {
		FilePanel,
		JobPanel,
		ProcessGraphPanel,
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
		supportsProcessGraphs() {
			return (this.supports('listProcessGraphs') || this.supports('createProcessGraph'));
		},
		supportsFiles() {
			return (this.supports('listFiles') || this.supports('uploadFile'));
		}
	},
	mounted() {
		this.$refs.tabs.resetActiveTab();
	}
}
</script>