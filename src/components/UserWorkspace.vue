<template>
	<Tabs id="userContent" ref="tabs">
		<Tab v-if="showJobs" id="jobs" name="Data Processing" icon="fa-tasks" @show="onShow" @hide="onHide">
			<JobPanel />
		</Tab>
		<Tab v-if="showServices" id="services" name="Web Services" icon="fa-cloud" @show="onShow" @hide="onHide">
			<ServicePanel />
		</Tab>
		<Tab v-if="showCustomProcesses" id="customProcesses" name="User-Defined Processes" icon="fa-sitemap" @show="onShow" @hide="onHide">
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
			return (this.supports('listJobs') || this.supports('createJob') || this.supports('computeResult'));
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

<style lang="scss">
#userContent {
	.data-table {
		> .menu {
			padding: 0.5em;
			background-color: #fff;
			border-bottom: 3px solid #ccc;
			position: sticky;
			top: 0;
			box-sizing: border-box;
			height: 2.5em;
			z-index: 10;
			margin: 0;
			white-space: nowrap;

			> .toolbar {
				flex-grow: 2;

				button {
					white-space: nowrap;
				}
			}
		}

		> table > thead {
			position: sticky;
			background-color: #fff;
			top: calc(2.5em + 2px);
			box-shadow: 0 2px 0 #ccc;
			z-index: 10;
			box-sizing: border-box;

			th {
				padding-top: 8px;
				border-top: 0;
			}
		}

		.title {
			word-break: break-all;
		}
	}
}
</style>