<template>
	<div id="wrapper">
		<div id="ide" :class="{authenticated: isAuthenticated}">
			<header class="navbar">
				<Logo />
				<ul id="menu">
					<li><div class="menuItem" @click="showHelp" title="Start a guided tour"><i class="fas fa-question fa-fw"></i> Help</div></li>
					<li><div class="menuItem" @click="showServerInfo" title="Get server information"><i class="fas fa-info fa-fw"></i> Server</div></li>
					<li><UserMenu /></li>
				</ul>
			</header>
			<Splitpanes class="default-theme" @resize="resized" @pane-maximize="resized">
				<Pane id="discovery" :size="splitpaneSizeH[0]">
					<DiscoveryToolbar class="toolbar tour-ide-discovery" :onAddProcess="insertProcess" :collectionPreview="true" :persist="true" />
				</Pane>
				<Pane id="workspace" :size="splitpaneSizeH[1]">
					<Splitpanes class="default-theme" horizontal @resize="resized" @pane-maximize="resized">
						<Pane id="editor" :size="splitpaneSizeV[0]">
							<Editor ref="editor" class="mainEditor tour-ide-editor" id="main" :value="process" @input="updateEditor" :title="contextTitle">
								<template #file-toolbar>
									<button type="button" @click="importProcess" title="Import process from external source"><i class="fas fa-cloud-download-alt"></i></button>
									<button type="button" v-show="saveSupported" :disabled="!hasProcess" @click="saveProcess" :title="'Save to ' + contextTitle"><i class="fas fa-save"></i></button>
									<button type="button" @click="exportCode" :disabled="!hasProcess" title="Export into another programming language"><i class="fas fa-file-export"></i></button>
									<button type="button" v-show="validateSupported" :disabled="!hasProcess" @click="validateProcess" title="Validate process on server-side"><i class="fas fa-tasks"></i></button>
								</template>
							</Editor>
						</Pane>
						<Pane id="user" :size="splitpaneSizeV[1]">
							<UserWorkspace v-if="isAuthenticated" class="userContent tour-ide-workspace" />
							<div v-else class="message info" title="Login is required to interact with the server.">
								<i class="fas fa-sign-in-alt"></i>
								<span class="login-message"><strong><a @click="login">Log in</a></strong> is required to interact with the server.</span>
							</div>
						</Pane>
					</Splitpanes>
				</Pane>
				<Pane id="viewer" :class="{empty: !showViewer}" :size="splitpaneSizeH[2]">
					<Viewer class="tour-ide-viewer" @empty="onViewerEmpty" />
				</Pane>
			</Splitpanes>
		</div>
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
		Pane
	},
	data() {
		return {
			showViewer: false,
			resizeListener: null,
			userInfoUpdater: null
		};
	},
	computed: {
		...Utils.mapState(['connection', 'isAuthenticated']),
		...Utils.mapState('editor', ['context', 'process', 'collectionPreview']),
		...Utils.mapGetters(['title', 'apiVersion', 'supports']),
		...Utils.mapGetters('jobs', {supportsJobUpdate: 'supportsUpdate'}),
		...Utils.mapGetters('services', {supportsServiceUpdate: 'supportsUpdate'}),
		...Utils.mapGetters('userProcesses', {supportsUserProcessUpdate: 'supportsUpdate'}),
		contextTitle() {
			return this.context !== null ? Utils.getResourceTitle(this.context, true) : ''
		},
		saveSupported() {
			return this.context !== null && (
				(this.context instanceof Job && this.supportsJobUpdate) ||
				(this.context instanceof Service && this.supportsServiceUpdate) ||
				(this.context instanceof UserProcess && this.supportsUserProcessUpdate)
			);
		},
		hasProcess() {
			return Utils.size(this.process) > 0;
		},
		validateSupported() {
			return this.supports('validateProcess');
		},
		splitpaneSizeH() {
			if (this.showViewer) {
				return [20, 40, 40];
			}
			else {
				return [25, 75, 0];
			}
		},
		splitpaneSizeV() {
			if (this.isAuthenticated) {
				return [50,50];
			}
			else {
				return [99,1];
			}
		}
	},
	async mounted() {
		this.initUserLocation();
		this.listen('showDataForm', this.showDataForm);
		this.listen('editProcess', this.editProcess);
		this.listen('showLogin', this.login);

		this.resizeListener = event => this.resized(event);
		window.addEventListener('resize', this.resizeListener);
		if (this.isAuthenticated) {
			this.userInfoUpdater = setInterval(() => this.describeAccount().catch(error => console.error(error)), this.$config.dataRefreshInterval*60*1000); // Refresh user data every x minutes
		}
		this.emit('title', this.title);

		if (this.collectionPreview) {
			this.$nextTick(() => {
				this.emit('showCollectionPreview', this.collectionPreview);
				this.setCollectionPreview(null);
			});
		}
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
		...Utils.mapActions(['describeAccount', 'initUserLocation']),
		...Utils.mapMutations(['discoveryCompleted']),
		...Utils.mapMutations('editor', ['setContext', 'setProcess', 'setCollectionPreview']),

		resized(event) {
			this.emit('windowResized', event);
		},
		onViewerEmpty(empty) {
			this.showViewer = !empty;
		},

		login() {
			this.discoveryCompleted(false);
		},

		importProcess() {
			let events = {
				save: this.updateEditor
			};
			this.emit('showModal', 'ImportProcessModal', {}, events);
		},

		saveProcess() {
			this.emit('replaceProcess', this.context, this.process);
		},

		async exportCode() {
			this.emit('showModal', 'ExportCodeModal');
		},

		async validateProcess() {
			if (!this.validateSupported) {
				return Utils.error(this, "Server doesn't support validation");
			}
			else if (!this.hasProcess) {
				return Utils.info(this, 'Nothing to validate...');
			}
			try {
				let errors = await this.connection.validateProcess(this.process);
				if (errors.length > 0) {
					errors.forEach(error => error.level = 'error');
					this.emit('viewLogs', errors, 'Validation Result', 'fa-tasks');
				}
				else {
					Utils.ok(this, "The process is valid");
				}
			} catch (error) {
				Utils.exception(this, error, "Validation rejected");
			}
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

		showServerInfo() {
			this.emit('showModal', 'ServerInfoModal');
		},

		showHelp() {
			this.emit('showTour', 'ide');
		},

		showDataForm(title, fields, saveCallback = null, closeCallback = null) {
			var editable = typeof saveCallback === 'function';
			var data = {};
			var parameters = [];
			for(let field of fields) {
				if (field === null) {
					continue;
				}
				parameters.push(new ProcessParameter(field));
				data[field.name] = field.value;
			}
	
			let props = {
				title,
				parameters,
				data,
				editable
			};
			let events = {};
			if (typeof saveCallback === 'function') {
				events.save = saveCallback;
			}
			if (typeof closeCallback === 'function') {
				events.closed = closeCallback;
			}
			this.emit('showModal', 'ParameterModal', props, events);
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

	&.empty {
		min-width: 0;
		padding: 0;
	}
}
#workspace {
	min-width: 400px;
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
#user {
	min-height: 2.5em;
}
#editor, .authenticated #user {
	min-height: 150px;
}
#editor {
	padding-bottom: 0.5rem;

	&:last-child {
		padding-bottom: 0;
	}
}

#user {
	padding-top: 0.5rem;

	.login-message {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
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

	li {
		position: relative;
		display: inline-block;
		height: 80px;

		&:hover {
			background-color: white;
			color: $mainColor;

			.dropdown {
				display: block;
				border-color: #ddd;
				border-style: solid;
				border-width: 0 1px 1px 1px;
			}
		}

		.menuItem {
			display: flex;
			align-items: center;
			cursor: pointer;
			padding: 10px 20px;
			height: 60px;
			font-size: 16px;
			font-weight: bold;
		}

		.dropdown {
			display: none;
			position: absolute;
			background-color: white;
			color: black;
			min-width: 200px;
			box-shadow: 8px 8px 8px 0px rgba(0,0,0,0.3);
			top: 80px;
			right: -1px;

			.item {
				padding: 10px;
				display: block;

				&.separator {
					border-bottom: 1px dotted $mainColor;
				}
			}

			hr {
				margin: 5px 10px;
			}

			a.item:hover {
				background-color: $mainColor;
				color: white;
			}
		}
	}
}

.tabContent .dataTable,
.tabContent table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.95em;

	td, th {
		border: 1px solid #ddd;
		padding: 3px;
	}
}
</style>