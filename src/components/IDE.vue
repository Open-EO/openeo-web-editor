<template>
	<div id="wrapper">
		<div id="ide" @mouseup="stopMovingSeparator($event)" @mousemove="moveSeparator($event)">
			<header class="navbar">
				<div class="logo">
					<a href="http://www.openeo.org" target="_blank"><img src="../assets/logo.png" alt="openEO" /></a>
					<h2>Web Editor</h2>
				</div>
				<ul id="menu">
					<li><div class="menuItem" @click="showServerInfo" title="Get server information"><i class="fas fa-info fa-fw"></i> Server</div></li>
					<li><UserMenu /></li>
				</ul>
			</header>
			<main class="page">
				<div id="workspace" ref="workspace">
					<Editor />
					<UserWorkspace />
				</div>
				<hr id="separator" ref="separator" @dblclick="centerSeparator()" @mousedown="startMovingSeparator($event)" />
				<div id="viewer">
					<Viewer />
				</div>
			</main>
		</div>
		<CollectionModal ref="collectionModal" />
		<ProcessModal ref="processModal" />
		<ServerInfoModal ref="serverInfoModal" />
	</div>
</template>

<script>
import EventBus from '../eventbus.js';
import Utils from '../utils.js';
import ConnectionMixin from './ConnectionMixin.vue';
import UserMenu from './UserMenu.vue';
import UserWorkspace from './UserWorkspace.vue';
import Viewer from './Viewer.vue';
import Editor from './Editor.vue';
import CollectionModal from './CollectionModal.vue';
import ProcessModal from './ProcessModal.vue';
import ServerInfoModal from './ServerInfoModal.vue';

export default {
	name: 'IDE',
	mixins: [ConnectionMixin],
	components: {
		Editor,
		Viewer,
		UserMenu,
		UserWorkspace,
		CollectionModal,
		ProcessModal,
		ServerInfoModal
	},
	data() {
		return {
			moving: false,
			movingOffset: 0
		};
	},
	computed: {
		...Utils.mapState('server', ['collections', 'processes']),
	},
	mounted() {
		EventBus.$on('showCollectionInfo', this.showCollectionInfo);
		EventBus.$on('showProcessInfo', this.showProcessInfo);
		this.updatePositions();
	},
	methods: {

		updatePositions() {
			var workspaceWidth = parseFloat(window.getComputedStyle(this.$refs.workspace).width);
			var x = window.pageXOffset || document.documentElement.scrollLeft;
			var separatorX = this.$refs.separator.getBoundingClientRect().left + x;
			this.movingOffset = separatorX - workspaceWidth;
		},

		startMovingSeparator(evt) {
			this.moving = false;
			if (evt.which === 1) {
				this.moving = true;
				this.updatePositions();
			}
		},

		stopMovingSeparator(evt) {
			this.moving = false;
		},

		moveSeparator(evt) {
			if (this.moving) {
				this.$refs.workspace.style.width = evt.x - this.movingOffset + "px";
				evt.preventDefault();
				evt.stopPropagation();
			}
		},

		centerSeparator() {
			this.moving = false;
			this.$refs.workspace.style.width = '60%';
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

		showServerInfo() {
			this.$refs.serverInfoModal.show(this.connection);
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
#workspace, #viewer {
	overflow: auto;
}
#workspace {
	padding: 1em;
	width: 60%;
	min-width: 300px;
	overflow-y: auto;
}
#viewer {
	flex: 1;
	padding: 1em;
	min-width: 200px;
}
#separator {
	border: 0;
	padding: 3px;
	margin: 0;
	border-right: 1px dotted #65421F;
	border-left: 1px dotted #65421F;
	cursor: e-resize;
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
	z-index: 2000;
}
#ide main.page {
	display: flex;
}
#ide .logo {
	margin: 10px 1em;
	display: inline-block;
	align-content: flex-start;
}
#ide .logo h2 {
	color: white;
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
</style>