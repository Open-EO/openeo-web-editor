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
				<Pane id="discovery" :size="splitpaneSize[0]">
					<DiscoveryToolbar class="toolbar" :onAddProcess="insertProcess" :collectionPreview="true" />
				</Pane>
				<Pane id="workspace" :size="splitpaneSize[1]">
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
				<Pane id="viewer" :size="splitpaneSize[2]">
					<Viewer />
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
		splitpaneSize() {
			if (this.isAuthenticated) {
				return [20,50,30];
			}
			else {
				return [20,40,40];
			}
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
		...Utils.mapActions(['describeAccount']),
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

		showServerInfo() {
			this.emit('showModal', 'ServerInfoModal');
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
#editor:last-child {
	padding-bottom: 0;
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