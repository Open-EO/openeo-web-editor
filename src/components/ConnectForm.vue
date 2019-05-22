<template>
	<div id="login">
		<form @submit.prevent="submitForm">
			<header class="logo">
				<img src="../assets/logo.png" alt="openEO" />
				<h2>Web Editor <span class="version" @click="showWebEditorInfo">{{ version }}</span></h2>
			</header>
			<div v-if="message" class="message" v-html="message"></div>
			<h3>Connect to server</h3>
			<div class="row">
				<label for="username">Server:</label>
				<div class="input">
					<input id="serverUrl" v-model.lazy.trim="serverUrl" />
					<button type="button" @click="showServerSelector" title="Select previously used server"><i class="fas fa-book"></i></button>
				</div>
			</div>
			<div class="row">
				<label for="username">Username:</label>
				<input class="input" id="username" type="text" v-model="username"/>
			</div>
			<div class="row">
				<label for="password">Password:</label>
				<input class="input" id="password" type="password" v-model="password"/>
			</div>
			<div class="row">
				<button type="submit" class="connectBtn" :class="{connecting: connecting}"><i class="fas fa-spinner fa-spin fa-lg"></i> Connect</button>
			</div>
		</form>
	</div>
</template>

<script>
import Package from '../../package.json';
import Config from '../../config.js';
import EventBus from '../eventbus.js';
import ConnectionMixin from './ConnectionMixin.vue';
import Utils from '../utils.js';

export default {
	name: 'ConnectForm',
	mixins: [ConnectionMixin],
	computed: {
		...Utils.mapState('server', ['connectionError', 'discoveryErrors']),
		...Utils.mapState('editor', ['storedServers'])
	},
	data() {
		return {
			serverUrl: Config.serverUrl,
			username: '',
			password: '',
			connecting: false,
			version: Package.version,
			message: Config.loginMessage
		};
	},
	created() {
		var serverFromQuery = Utils.param('server');
		if (Utils.isUrl(serverFromQuery)) {
			this.serverUrl = serverFromQuery;
		}
	},
	methods: {
		...Utils.mapActions('server', ['connect', 'authenticateBasic']),
		...Utils.mapMutations('editor', ['addServer', 'removeServer']),

		async submitForm() {
			if (typeof this.serverUrl !== 'string' || !Utils.isUrl(this.serverUrl)) {
				Utils.error(this, 'Please specify a valid server.');
				return;
			}
			else if (window.location.protocol === 'https:' && this.serverUrl.toLowerCase().substr(0,6) !== 'https:') {
				Utils.error(this, 'You are trying to connect to a back-end with HTTP instead of HTTPS, which is insecure and prohibited by web browsers. Please use HTTPS instead.');
				return;
			}

			var awaitingAuth = (this.username || this.password);
			this.connecting = true;
			try {
				if (await this.connect({url: this.serverUrl, requireAuthentication: awaitingAuth})) {
					this.addServer(this.serverUrl);
				}
				else {
					this.connecting = false;
					Utils.exception(this, this.connectionError);
					return;
				}
			} catch (error) {
				this.connecting = false;
				Utils.exception(this, error);
				return;
			}

			for(var error of this.discoveryErrors) {
				Utils.exception(this, error);
			}

			if (awaitingAuth) {
				try {
					if (!this.supports('authenticateBasic') && this.supports('authenticateOIDC')) {
						Utils.error(this, 'Sorry, the authentication methods supported by the back-end are not supported by the Web Editor.');
					}
					else if (this.supports('authenticateBasic')) {
						await this.authenticateBasic({username: this.username, password: this.password});
						Utils.ok(this, 'Login successful.');
					}
					else {
						Utils.error(this, 'Sorry, the authentication methods is not supported by the Web Editor.');
					}
				} catch {
					Utils.error(this, 'Sorry, credentials are wrong.');
				}
			}
			else {
				Utils.info(this, 'You are working as a guest. Your data will be publicly available!');
			}
			this.connecting = false;
		},

		showWebEditorInfo() {
			EventBus.$emit('showWebEditorInfo');
		},

		showServerSelector() {
			EventBus.$emit(
				'showListModal', 
				"Select previously used server",
				this.storedServers,
				[
					{
						callback: (url) => {
							this.serverUrl = url;
							return true;  // return true to close the modal
						}
					},
					{
						callback: (url) => this.removeServer(url),
						icon: 'trash',
						title: 'Delete entry from history'
					}
				]
			);
		}
	}
}
</script>

<style>
#login {
	height: 100%;
	background-color: #1665B6;
	align-items: center;
	display: flex;
	justify-content: center;
}
#login header {
	text-align: center;
	margin-bottom: 3em;
}
#login h3 {
	margin: 0 0 0.75em 0;
}
#login form {
	width: 500px;
	background-color: #fff;
	border: 1px solid #152558;
	border-radius: 3em;
	padding: 3em;
	font-family: 'Ubuntu', sans-serif;
}
#login .row {
	display: flex;
	margin: 0.5em 0;
}
#login label {
	width: 30%;
	display: flex;
	align-items: center;
}
#login .input {
	flex-grow: 1;
	display: flex;
}
#login .input input {
	flex-grow: 1;
}
#login input {
	padding: 0.3em;
}
#login input, #login button {
	margin: 3px;
}
#login .message {
	padding: 0.5em;
	margin-bottom: 1.5em;
	border: 1px solid #f9d67a;
	border-radius: 0.5em;
	background-color: #fbeabc;
	color: #795600;
}
#login .connectBtn {
	width: 100%;
	margin: 0.75em 0 0 0;
	padding: 0.3em 1.33em 0.3em 0;
}
#login .fa-spinner {
	visibility: hidden;
}
#login .connecting .fa-spinner {
	visibility: visible;
}
</style>
