<template>
	<div id="wrapper">
		<div id="ide" @mouseup="stopMovingSeparator($event)" @mousemove="moveSeparator($event)">
			<header class="navbar">
				<Logo />
				<ul id="menu">
					<li><div class="menuItem" @click="showServerInfo" title="Get server information"><i class="fas fa-info fa-fw"></i> Server</div></li>
					<li><UserMenu /></li>
				</ul>
			</header>
			<main class="page">
				<div id="discovery" ref="discovery">
					<DiscoveryToolbar class="toolbar" :onAddProcess="insertProcess" />
				</div>
				<hr class="separator" ref="separator0" @dblclick="centerSeparator($event, 0)" @mousedown="startMovingSeparator($event, 0)" />
				<div id="workspace" ref="workspace">
					<Editor ref="editor" class="mainEditor" id="main" :value="process" @input="updateEditor" :title="contextTitle">
						<template #file-toolbar>
							<button type="button" v-show="saveSupported" @click="saveProcess" :title="'Save to ' + contextTitle"><i class="fas fa-save"></i></button>
						</template>
					</Editor>
					<UserWorkspace class="userContent" v-if="isAuthenticated" />
				</div>
				<hr class="separator" ref="separator1" @dblclick="centerSeparator($event, 1)" @mousedown="startMovingSeparator($event, 1)" />
				<div id="viewer" ref="viewer">
					<Viewer />
				</div>
			</main>
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
			moving: false,
			movingOffset: 0,
			separators: [
				{
					left: 'discovery',
					right: 'workspace',
					anchor: 'left',
					width: '20%'
				},
				{
					left: 'workspace',
					right: 'viewer',
					anchor: 'right',
					width: '30%'
				}
			],
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

		this.resizeListener = (event) => this.emit('windowResized', event);
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

		startMovingSeparator(evt, id) {
			this.moving = false;
			if (evt.which === 1) {
				this.moving = id;
			}
		},

		stopMovingSeparator(evt) {
			this.moving = false;
		},

		moveSeparator(evt) {
			if (this.moving !== false && this.separators[this.moving] && evt.movementX !== 0) {
				var sep = this.separators[this.moving];
				var elem = this.$refs[sep[sep.anchor]];
				var x;
				if (sep.anchor === 'right') {
					x = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth, document.body.offsetWidth, document.documentElement.offsetWidth, document.documentElement.clientWidth) - evt.x;
				}
				else {
					x = evt.x;
				}
				elem.style.width = x + 'px';
				this.emit('windowResized', evt);
				evt.preventDefault();
				evt.stopPropagation();
			}
		},

		centerSeparator(event, id) {
			this.moving = false;
			var sep = this.separators[id];
			if (!sep) {
				return;
			}

			var elem = this.$refs[sep[sep.anchor]];
			if (elem.getBoundingClientRect().width < 220) {
				elem.style.width = sep.width;
			}
			else {
				elem.style.width = 0;
			}
			this.emit('windowResized', event);
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

#ide {
	margin-top: 80px;
	height: calc(100% - 80px);
	background-color: white;
}
#ide main, #workspace, #viewer, #wrapper {
	height: 100%;
}
#discovery {
	width: 20%;
	min-width: 200px;
}
#discovery .search-box {
	margin: 1em;
}
#discovery .category {
	padding: 5px 1em;;
}
#workspace, #viewer {
	box-sizing: border-box;
	padding: 1em;
}
#workspace {
	flex-grow: 1;
	min-width: 300px;
	width: 300px; /* Set a fixed size so that the box doesn't change size when tabs are changed or so. flex-grow will make the width larger/smaller anyway */
	display: flex;
	flex-direction: column;
}
#viewer {
	min-width: 200px;
	width: 25%;
}
#workspace .mainEditor.tabs,
#workspace .userContent.tabs {
	height: 50%;
	flex-grow: 1;
}
.separator {
	border: 0;
	padding: 3px;
	margin: 0;
	border-right: 1px dotted #aaa;
	border-left: 1px dotted #aaa;
	cursor: e-resize;
}
.infoViewer {
	height: 450px;
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
#ide main.page {
	display: flex;
}
#ide .logo {
	flex-grow: 1;
	align-content: flex-start;
	white-space: nowrap;
	overflow: hidden;
	justify-content: left;
	padding-left: 1em;
}
#menu {
	list-style-type: none;
	margin: 0 1em;
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