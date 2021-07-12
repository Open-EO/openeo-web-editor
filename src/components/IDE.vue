<template>
	<div id="wrapper">
		<div id="ide">
			<header class="navbar">
				<Logo />
				<ul id="menu">
					<li><div class="menuItem" @click="showServerInfo" title="Get server information"><i class="fas fa-info fa-fw"></i> Server</div></li>
					<li><UserMenu /></li>
				</ul>
			</header>
			<Splitpanes class="default-theme" @resize="resized" @pane-maximize="resized">
				<Pane id="discovery" size="20">
					<DiscoveryToolbar class="toolbar" :onAddProcess="insertProcess" />
				</Pane>
				<Pane id="workspace" size="50">
					<Splitpanes class="default-theme" horizontal @resize="resized" @pane-maximize="resized">
						<Pane id="editor" size="50">
							<Editor ref="editor" class="mainEditor" id="main" :value="process" @input="updateEditor" :title="contextTitle">
								<template #file-toolbar>
									<button type="button" v-show="saveSupported" @click="saveProcess" :title="'Save to ' + contextTitle"><i class="fas fa-save"></i></button>
								</template>
							</Editor>
						</Pane>
						<Pane id="user" size="50" v-if="isAuthenticated">
							<UserWorkspace class="userContent" />
						</Pane>
					</Splitpanes>
				</Pane>
				<Pane id="viewer" size="30">
					<Viewer />
				</Pane>
			</Splitpanes>
		</div>
		<CollectionModal ref="collectionModal" />
		<ProcessModal ref="processModal" />
		<ServerInfoModal ref="serverInfoModal" />
		<ServiceInfoModal ref="serviceModal" />
		<JobInfoModal ref="jobModal" />
		<ParameterModal ref="parameterModal" />
		<SchemaModal ref="schemaModal" />
		<UdfRuntimeModal ref="udfRuntimeModal" />
		<FileFormatModal ref="fileFormatModal" />
		<JobEstimateModal ref="jobEstimateModal" />
	</div>
</template>

<script>
import EventBusMixin from './EventBusMixin.vue';
import Utils from '../utils.js';
import UserMenu from './UserMenu.vue';
import UserWorkspace from './UserWorkspace.vue';
import Viewer from './Viewer.vue';
import Editor from './Editor.vue';
import Logo from './Logo.vue';
import DiscoveryToolbar from './DiscoveryToolbar.vue';
import { ProcessParameter } from '@openeo/js-commons';
import { Job, Service, UserProcess } from '@openeo/js-client';
import { Splitpanes, Pane } from 'splitpanes';

export default {
	name: 'IDE',
	mixins: [EventBusMixin],
	components: {
		DiscoveryToolbar,
		Editor,
		Logo,
		Viewer,
		UserMenu,
		UserWorkspace,
		Splitpanes,
		Pane,
		CollectionModal: () => import('./modals/CollectionModal.vue'),
		ProcessModal: () => import('./modals/ProcessModal.vue'),
		ServerInfoModal: () => import('./modals/ServerInfoModal.vue'),
		JobInfoModal: () => import('./modals/JobInfoModal.vue'),
		JobEstimateModal: () => import('./modals/JobEstimateModal.vue'),
		ServiceInfoModal: () => import('./modals/ServiceInfoModal.vue'),
		ParameterModal: () => import('./modals/ParameterModal.vue'),
		SchemaModal: () => import('./modals/SchemaModal.vue'),
		FileFormatModal: () => import('./modals/FileFormatModal.vue'),
		UdfRuntimeModal: () => import('./modals/UdfRuntimeModal.vue'),
	},
	data() {
		return {
			resizeListener: null,
			userInfoUpdater: null
		};
	},
	computed: {
		...Utils.mapState(['connection', 'isAuthenticated']),
		...Utils.mapState('editor', ['context', 'process']),
		...Utils.mapGetters(['title', 'apiVersion']),
		...Utils.mapGetters('jobs', {supportsJobUpdate: 'supportsUpdate'}),
		...Utils.mapGetters('services', {supportsServiceUpdate: 'supportsUpdate'}),
		...Utils.mapGetters('userProcesses', {getProcessById: 'getAllById', supportsUserProcessUpdate: 'supportsUpdate'}),
		contextTitle() {
			return this.context !== null ? Utils.getResourceTitle(this.context, true) : ''
		},
		saveSupported() {
			return this.context !== null && (
				(this.context instanceof Job && this.supportsJobUpdate) ||
				(this.context instanceof Service && this.supportsServiceUpdate) ||
				(this.context instanceof UserProcess && this.supportsUserProcessUpdate)
			);
		}
	},
	async created() {
		try {
			await this.loadInitialProcess();
		} catch (error) {
			Utils.exception(this, error, "Loading process failed");
		}

	},
	mounted() {
		this.listen('showCollection', this.showCollectionInfo);
		this.listen('showProcess', this.showProcessInfoById);
		this.listen('showJobInfo', this.showJobInfo);
		this.listen('showJobEstimate', this.showJobEstimate);
		this.listen('showProcessInfo', this.showProcessInfo);
		this.listen('showServiceInfo', this.showServiceInfo);
		this.listen('showUdfRuntimeInfo', this.showUdfRuntimeInfo);
		this.listen('showFileFormatInfo', this.showFileFormatInfo);
		this.listen('showSchema', this.showSchemaInfo);
		this.listen('showDataForm', this.showDataForm);
		this.listen('editProcess', this.editProcess);

		this.resizeListener = event => this.resized(event);
		window.addEventListener('resize', this.resizeListener);
		if (this.isAuthenticated) {
			this.userInfoUpdater = setInterval(this.describeAccount, this.$config.dataRefreshInterval*60*1000); // Refresh user data every x minutes
		}
		this.emit('title', this.title);
	},
	beforeDestroy() {
		if (this.resizeListener !== null) {
			window.removeEventListener('resize', this.resizeListener);
		}
		if (this.userInfoUpdater !== null) {
			clearInterval(this.userInfoUpdater);
		}
	},
	methods: {
		...Utils.mapActions(['describeAccount', 'describeCollection']),
		...Utils.mapActions('userProcesses', {readUserProcess: 'read'}),
		...Utils.mapActions('editor', ['loadInitialProcess']),
		...Utils.mapMutations('editor', ['setContext', 'setProcess']),

		resized(event) {
			this.emit('windowResized', event);
		},

		saveProcess() {
			this.emit('replaceProcess', this.context, this.process);
		},

		updateEditor(value) {
			this.setProcess(value);
			if (value === null) {
				this.setContext(null);
			}
		},

		editProcess(obj) {
			this.setContext(obj);
		},

		insertProcess(node) {
			this.$refs.editor.insertProcess(node);
		},

		showCollectionInfo(id) {
			this.describeCollection(id)
				.then(info => this.$refs.collectionModal.show(info))
				.catch(error => Utils.error(this, "Sorry, can't load collection details for " + id + "."));
		},

		showProcessInfoById(id) {
			this._showProcessInfo(this.getProcessById(id));
		},

		showProcessInfo(process) {
			this._showProcessInfo(process);
		},

		showUdfRuntimeInfo(id, data, version = null) {
			this.$refs.udfRuntimeModal.show(id, data, version);
		},

		showFileFormatInfo(id, format, type) {
			this.$refs.fileFormatModal.show(id, format, type);
		},

		showSchemaInfo(name, schema, msg = null) {
			if (msg === null) {
				msg = "This is a parameter for a user-defined process.\n"
					+ "It is a value made available by the parent entity (usually another process or a secondary web service) that is executing this processes for further use.\n"
					+ "The value will comply to the following data type(s):";
			}
			this.$refs.schemaModal.show(name, schema, msg);
		},

		_showProcessInfo(process) {
			if (!process.native) {
				this.readUserProcess({data: process})
					.then(updated => this._showProcessInfoModal(updated.toJSON()))
					.catch(error => Utils.exception(this, error, "Load Process Error: " + process.id));
			}
			else {
				this._showProcessInfoModal(process);
			}
		},

		_showProcessInfoModal(process) {
			this.$refs.processModal.show(process);
		},

		showServiceInfo(service) {
			this.$refs.serviceModal.show(service);
		},

		showJobInfo(job, result = null) {
			this.$refs.jobModal.show(job, result);
		},

		showJobEstimate(job, estimate) {
			this.$refs.jobEstimateModal.show(job, estimate);
		},

		showServerInfo() {
			this.$refs.serverInfoModal.show();
		},

		showDataForm(title, fields, saveCallback = null, closeCallback = null) {
			var editable = typeof saveCallback === 'function';
			var values = {};
			var parameters = [];
			for(let field of fields) {
				if (field === null) {
					continue;
				}
				parameters.push(new ProcessParameter(field));
				values[field.name] = field.value;
			}
			this.$refs.parameterModal.show(title, parameters, values, editable, saveCallback, closeCallback);
		}

	}
}
</script>

<style lang="scss">
@import '../../theme.scss';
@import '~splitpanes/dist/splitpanes.css';

.splitpanes.default-theme {
  .splitpanes__pane {
    background-color: transparent;
  }
  .splitpanes__splitter {
	  border: 0;
  }
  > * {
	-webkit-transition: none;
	transition: none;
  }
}

#ide {
	margin-top: 80px;
	height: calc(100% - 80px);
	background-color: white;
}
#wrapper {
	height: 100%;
}
#workspace, #viewer {
	height: 100%;
	min-width: 200px;
	padding: 1rem;
	box-sizing: border-box;
}
#workspace {
	min-width: 300px;
}
#discovery {
	height: 100%;
	overflow: auto;

	.search-box {
		margin: 1rem;
	}
	.category {
		padding: 5px 1em;
	}
}
#editor, #user {
	width: 100%;
	min-height: 150px;
}
#editor {
	padding-bottom: 0.5rem;
}
#user {
	padding-top: 0.5rem;
}
#ide header.navbar {
	width: 100%;
	background-color: $mainColor;
	color: white;
	height: 80px;
	position: fixed;
	top: 0;
	display: flex;
	justify-content: space-between;
	z-index: 100;
}
#ide .logo {
	flex-grow: 1;
	align-content: flex-start;
	white-space: nowrap;
	overflow: hidden;
	justify-content: left;
	padding-left: 1rem;
}

#menu {
	list-style-type: none;
	margin: 0 1rem;
	padding: 0;
	display: flex;
	align-items: center;
}
#menu li {
	position: relative;
	display: inline-block;
	height: 80px;
}
#menu li:hover {
	background-color: white;
	color: $mainColor;
}
#menu li:hover .dropdown {
	display: block;
	border-color: #ddd;
	border-style: solid;
	border-width: 0 1px 1px 1px;
}
#menu li .menuItem {
	display: flex;
	align-items: center;
	cursor: pointer;
	padding: 10px 20px;
	height: 60px;
	font-size: 16px;
	font-weight: bold;
}
#menu li .dropdown {
	display: none;
	position: absolute;
	background-color: white;
	color: black;
	min-width: 200px;
	box-shadow: 8px 8px 8px 0px rgba(0,0,0,0.3);
	top: 80px;
	right: -1px;
}
#menu li .dropdown .item {
	padding: 10px;
	border-top: 1px dotted #ccc;
}
#menu li .dropdown .item:first-of-type {
	border-top: 0;
}
#menu li .dropdown .item button {
	width: 100%;
}

.tabContent .dataTable, .tabContent table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.95em;
}
.tabContent table td,
.tabContent table th {
	border: 1px solid #ddd;
	padding: 3px;
}
</style>