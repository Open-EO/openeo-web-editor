<template>
	<div id="wrapper">
		<div id="ide" @mouseup="stopMovingSeparator($event)" @mousemove="moveSeparator($event)">
			<header class="navbar">
				<div class="logo">
					<img src="../assets/logo.png" alt="openEO" />
					<h2>Web Editor <span class="version" @click="showWebEditorInfo">{{ version }}</span></h2>
				</div>
				<ul id="menu">
					<li><div class="menuItem" @click="showServerInfo" title="Get server information"><i class="fas fa-info fa-fw"></i> Server</div></li>
					<li><UserMenu /></li>
				</ul>
			</header>
			<main class="page">
				<div id="discovery" ref="discovery">
					<DiscoveryToolbar class="toolbar" :onAddCollection="insertCollection" :onAddProcess="insertProcess" />
				</div>
				<hr class="separator" ref="separator0" @dblclick="centerSeparator($event, 0)" @mousedown="startMovingSeparator($event, 0)" />
				<div id="workspace" ref="workspace">
					<Editor ref="editor" class="mainEditor" id="main" :showDiscoveryToolbar="false" />
					<UserWorkspace class="userContent" />
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
		<ProcessGraphInfoModal ref="pgModal" />
		<ParameterModal ref="parameterModal" />
	</div>
</template>

<script>
import Package from '../../package.json';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import Utils from '../utils.js';
import ConnectionMixin from './ConnectionMixin.vue';
import UserMenu from './UserMenu.vue';
import UserWorkspace from './UserWorkspace.vue';
import Viewer from './Viewer.vue';
import Editor from './Editor.vue';
import CollectionModal from './CollectionModal.vue';
import ProcessModal from './ProcessModal.vue';
import ServerInfoModal from './ServerInfoModal.vue';
import JobInfoModal from './JobInfoModal.vue';
import ProcessGraphInfoModal from './ProcessGraphInfoModal.vue';
import ServiceInfoModal from './ServiceInfoModal.vue';
import ParameterModal from './ParameterModal.vue';
import DiscoveryToolbar from './DiscoveryToolbar.vue';

export default {
	name: 'IDE',
	mixins: [ConnectionMixin, EventBusMixin],
	components: {
		DiscoveryToolbar,
		Editor,
		Viewer,
		UserMenu,
		UserWorkspace,
		CollectionModal,
		ProcessModal,
		ServerInfoModal,
		JobInfoModal,
		ProcessGraphInfoModal,
		ServiceInfoModal,
		ParameterModal
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
					width: "20%"
				},
				{
					left: 'workspace',
					right: 'viewer',
					anchor: 'right',
					width: "30%"
				}
			],
			version: Package.version,
			resizeListener: null,
			userInfoUpdater: null
		};
	},
	computed: {
		...Utils.mapState('server', ['collections', 'processes', 'outputFormats', 'serviceTypes']),
	},
	mounted() {
		this.listen('showCollectionInfo', this.showCollectionInfo);
		this.listen('showProcessInfo', this.showProcessInfo);
		this.listen('showJobInfo', this.showJobInfo);
		this.listen('showProcessGraphInfo', this.showProcessGraphInfo);
		this.listen('showServiceInfo', this.showServiceInfo);
		this.listen('showDataForm', this.showDataForm);
		this.listen('getProcessGraph', this.getProcessGraph);
		this.listen('insertProcessGraph', this.insertProcessGraph);

		this.resizeListener = (event) => this.emit('windowResized', event);
		window.addEventListener('resize', this.resizeListener);
		this.userInfoUpdater = setInterval(this.describeAccount, 2*60*1000); // Refresh user data every 2 minutes
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
		...Utils.mapActions('server', ['describeAccount']),

		getProcessGraph(success, failure = null, passNull = false) {
			this.$refs.editor.getProcessGraph(success, failure, passNull);
		},

		insertProcessGraph(pg) {
			this.$refs.editor.insertProcessGraph(pg);
		},

		insertCollection(id) {
			this.$refs.editor.insertCollection(id);
		},

		insertProcess(id) {
			this.$refs.editor.insertProcess(id);
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
			this.connection.describeCollection(id)
				.then(info => {
					this.$refs.collectionModal.show(info, this.apiVersion);
				})
				.catch(error => Utils.error(this, "Sorry, can't load collection details."));
		},

		showProcessInfo(id) {
			const info = this.processes.find(p => p.id == id);
			this.$refs.processModal.show(info, this.apiVersion);
		},

		showServiceInfo(service) {
			this.$refs.serviceModal.show(service);
		},

		showJobInfo(job) {
			this.$refs.jobModal.show(job);
		},

		showProcessGraphInfo(pg) {
			this.$refs.pgModal.show(pg);
		},

		showServerInfo() {
			this.$refs.serverInfoModal.show(this.connection, this.outputFormats, this.serviceTypes);
		},

		showWebEditorInfo() {
			this.emit('showWebEditorInfo');
		},

		showDataForm(title, fields, saveCallback = null, closeCallback = null) {
			var editable = typeof saveCallback === 'function';
			this.$refs.parameterModal.show(title, fields.filter(f => f !== null), editable, saveCallback, closeCallback);
		}

	}
}
</script>

<style>
#ide {
	margin-top: 80px;
	height: calc(100vh - 80px);
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
	width: 30%;
}
.mainEditor, .userContent {
	height: calc(50% - 1em);
	flex-grow: 1;
}
.separator {
	border: 0;
	padding: 3px;
	margin: 0;
	border-right: 1px dotted #65421F;
	border-left: 1px dotted #65421F;
	cursor: e-resize;
}
.infoViewer {
	height: 450px;
}
#ide header.navbar {
	width: 100%;
	background-color: #1665B6;
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
	margin: 10px 1em;
	display: inline-block;
	align-content: flex-start;
	overflow: hidden;
}
#ide .logo h2 {
	color: white;
}
#ide .logo .version {
	background-color: #1665B6;
	color: white;
}
#ide .logo .version:hover {
	background-color: white;
	color: #1665B6;
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
	color: #1665B6;
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
}
.tabContent table td,
.tabContent table th {
	border: 1px solid #ddd;
	padding: 3px;
}
</style>