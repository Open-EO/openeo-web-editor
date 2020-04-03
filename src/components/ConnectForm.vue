<template>
	<div id="login">
		<div class="inner">
			<header class="logo">
				<img src="../assets/logo.png" alt="openEO" />
				<h2>Web Editor <span class="version" @click="showWebEditorInfo">{{ version }}</span></h2>
			</header>
			<div v-if="httpsUrl" class="message">
				You are using an <strong>insecure</strong> HTTP connection, which is not encrypted. Please use HTTPS if possible.<br />
				<a :href="httpsUrl">Click here to switch to a secured HTTPS connection.</a>
			</div>
			<div v-if="message" class="message" v-html="message"></div>
			<form @submit.prevent="submitForm" v-if="showConnectForm" class="connect">
				<h3>Connect to server</h3>
				<div class="row">
					<label for="serverUrl">URL:</label>
					<div class="input">
						<input id="serverUrl" v-model.lazy.trim="serverUrl" :disabled="autoConnect" />
						<button v-if="allowOtherServers" type="button" @click="showServerSelector" title="Select previously used server"><i class="fas fa-book"></i></button>
					</div>
				</div>
				<div class="row">
					<button type="submit" class="connectBtn" :class="{loading: loading}"><i class="fas fa-spinner fa-spin fa-lg"></i> Connect</button>
				</div>
			</form>
			<div v-else-if="this.showLoginForm" class="login">
				<h3>Log in to {{ title }}</h3>
				<Tabs id="credentials" :pills="true">
					<Tab v-if="supportsOidc" id="oidc" name="OpenID Connect">
						<form @submit.prevent="loginOidc">
							<div class="row help">
								<i class="fas fa-info-circle"></i>
								<span>Common and most secure workflow to login at a provider, usually with username and password. You need to specify a <em>Client ID</em>, which will be provided to you by the provider. You need to allow the URL of this service as redirect URL for the authentication service.</span>
							</div>
							<div class="row">
								<label for="password">Client ID:</label>
								<input class="input" id="clientId" type="text" v-model="clientId" required="required" />
							</div>
							<div class="row">
								<button type="submit" class="connectBtn" :class="{loading: loading}"><i class="fas fa-spinner fa-spin fa-lg"></i><i class="fab fa-openid"></i> Connect with OpenID Connect (experimental)</button>
							</div>
						</form>
					</Tab>
					<Tab v-if="supportsBasic" id="basic" name="Basic">
						<form @submit.prevent="loginBasic">
							<div class="row help">
								<i class="fas fa-info-circle"></i>
								<span>The <tt>Basic</tt> is mostly used for development and testing purposes. You can log in with username and password.</span>
							</div>
							<div class="row">
								<label for="username">Username:</label>
								<input class="input" id="username" type="text" v-model="username" required="required" />
							</div>
							<div class="row">
								<label for="password">Password:</label>
								<input class="input" id="password" type="password" v-model="password" required="required" />
							</div>
							<div class="row">
								<button type="submit" class="connectBtn" :class="{loading: loading}"><i class="fas fa-spinner fa-spin fa-lg"></i> Log in</button>
							</div>
						</form>
					</Tab>
					<Tab id="noauth" name="No credentials">
						<form @submit.prevent="loginNoAuth(skipLogin)">
							<div class="row help">
								<i class="fas fa-info-circle"></i>
								<span>Choose this if you don't have credentials for the service provider and just want to explore the service with its available data and processes. You may not be able to process any data.</span>
							</div>
							<div class="row">
								<button type="submit" class="connectBtn" :class="{loading: loading}"><i class="fas fa-spinner fa-spin fa-lg"></i><i class="fas fa-user-slash"></i> Proceed without logging in</button>
							</div>
						</form>
					</Tab>
				</Tabs>
			</div>
		</div>
	</div>
</template>

<script>
import Package from '../../package.json';
import Config from '../../config.js';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import ConnectionMixin from './ConnectionMixin.vue';
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import Tab from '@openeo/vue-components/components/Tab.vue';
import Utils from '../utils.js';
import { OpenEO, OidcProvider } from '@openeo/js-client';

export default {
	name: 'ConnectForm',
	mixins: [ConnectionMixin, EventBusMixin],
	components: {
		Tabs,
		Tab
	},
	props: {
		skipLogin: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		...Utils.mapState(['connectionError', 'discoveryErrors']),
		...Utils.mapGetters(['isConnected', 'isDiscovered', 'isAuthenticated', 'title']),
		...Utils.mapState('editor', ['storedServers']),
		httpsUrl() {
			if (Config.showHttpWarning && window.location.protocol === 'http:') {
				return window.location.toString()
					.replace(/^http:/i, 'https:')
					.replace(/([\?&]server=http)(:|%3A)/, '$1s$2');
			}
			
			return null;
		},
		supportsOidc() {
			return this.supports('authenticateOIDC');
		},
		supportsBasic() {
			return this.supports('authenticateBasic');
		},
		showConnectForm() {
			return !this.isConnected || this.skipLogin;
		},
		showLoginForm() {
			return !this.showConnectForm && !this.isDiscovered && !this.skipLogin;
		}
	},
	watch: {
		showConnectForm(newVal) {
			if (newVal) {
				this.emit('title', 'Connect to server');
			}
		},
		showLoginForm(newVal) {
			if (newVal) {
				this.emit('title', 'Log in');
			}
		}
	},
	data() {
		return {
			serverUrl: Config.serverUrl,
			allowOtherServers: !Config.serverUrl,
			autoConnect: false,
			username: '',
			password: '',
			clientId: '',
			loading: false,
			version: Package.version,
			message: Config.loginMessage
		};
	},
	created() {
		// ToDo: Enable OIDC
//		OidcProvider.signinCallbackOIDC('popup');

		var serverFromQuery = Utils.param('server');
		if (Utils.isUrl(serverFromQuery)) {
			this.serverUrl = serverFromQuery;
		}

		if (this.serverUrl) {
			this.autoConnect = true;
		}
	},
	mounted() {
		window.onpopstate = evt => this.historyNavigate(evt);
		window.history.replaceState({reset: true, serverUrl: this.serverUrl}, "");
		if (this.autoConnect) {
			this.submitForm();
		}
	},
	methods: {
		...Utils.mapActions(['connect', 'discover', 'authenticateBasic', 'authenticateOIDC', 'logout']),
		...Utils.mapMutations('editor', ['addServer', 'removeServer']),

		historyNavigate(evt) {
			if (!Utils.isObject(evt.state) || evt.state.reset) {
				this.logout();
				this.autoConnect = false;
				this.loading = false;
				this.password = '';
			}
			if (Utils.isObject(evt.state)) {
				if (evt.state.serverUrl) {
					this.serverUrl = evt.state.serverUrl;
				}
				if (evt.state.autoConnect) {
					this.autoConnect = true;
				}
			}
			if (this.autoConnect) {
				this.initConnection(!!evt.state.skipLogin, true);
			}
		},

		async submitForm() {
			if (!this.isConnected) {
				this.initConnection(this.skipLogin, false);
			}
		},

		async loginOidc() {
			await this.initDiscovery('oidc');
		},

		async loginBasic() {
			await this.initDiscovery('basic');
		},

		async loginNoAuth(skipLogin = false) {
			await this.initDiscovery(skipLogin ? 'discover' : 'noauth');
		},

		async initConnection(skipLogin = false, programmatically = false) {
			if (typeof this.serverUrl !== 'string' || !Utils.isUrl(this.serverUrl)) {
				Utils.error(this, 'Please specify a valid server.');
				return;
			}
			else if (window.location.protocol === 'https:' && this.serverUrl.toLowerCase().substr(0,6) !== 'https:') {
				Utils.error(this, 'You are trying to connect to a back-end with HTTP instead of HTTPS, which is insecure and prohibited by web browsers. Please use HTTPS instead.');
				return;
			}

			this.loading = true;
			try {
				if (await this.connect({url: this.serverUrl})) {
					this.addServer(this.serverUrl);
					if (!programmatically) {
						window.history.pushState({reset: true, serverUrl: this.serverUrl, autoConnect: true}, "", ".?server=" + this.serverUrl);
					}
					if (skipLogin) {
						await this.loginNoAuth(skipLogin);
					}
				}
				else {
					Utils.exception(this, this.connectionError);
				}
			} catch (error) {
				Utils.exception(this, error);
			}

			this.loading = false;
			if (!this.isConnected && this.allowOtherServers) {
				this.autoConnect = false;
			}
		},

		async initDiscovery(type) {
			this.loading = true;
			try {
				if (type === 'basic') {
					await this.authenticateBasic({
						username: this.username,
						password: this.password
					});
				}
				else if (type === 'oidc') {
					await this.authenticateOIDC({
						client_id: this.clientId,
						redirect_uri: window.location,
						scope: 'openid email',
						uiMethod: 'popup',
						automaticSilentRenew: true
					});
				}
				else { // noauth or discover
					Utils.info(this, 'You are working as a guest. Your data will be publicly available!');
					window.history.pushState({reset: true, serverUrl: this.serverUrl, autoConnect: true, skipLogin: true}, "", ".?server=" + this.serverUrl + "&discover=1");
				}
			} catch(error) {
				console.log(error);
				Utils.error(this, 'Sorry, credentials are wrong.');
				this.loading = false;
				return;
			}
			
			await this.discover();
			for(var error of this.discoveryErrors) {
				Utils.exception(this, error);
			}

			this.loading = false;

			if (this.isAuthenticated) {
				Utils.ok(this, 'Login successful.');
				window.history.pushState({reset: true, serverUrl: this.serverUrl, autoConnect: true}, "", ".?server=" + this.serverUrl);
			}
		},

		showWebEditorInfo() {
			this.emit('showWebEditorInfo');
		},

		showServerSelector() {
			this.emit(
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
#login .inner {
	width: 500px;
	background-color: #fff;
	border: 1px solid #152558;
	border-radius: 3em;
	padding: 3em;
	font-family: 'Ubuntu', sans-serif;
}
#login #credentials.tabs .tabsBody {
	overflow: visible;
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
#login .tabsHeader {
	margin-bottom: 0.5em;
}
#login .help {
	display: flex;
	margin: 0.5em;
}
#login .help span {
	font-size: 0.9em;
	display: block;
	flex-grow: 1;
}
#login .help .fa-info-circle {
	display: block;
	height: 100%;
	margin-right: 0.5em;
}
#login .connectBtn {
	width: 100%;
	margin: 0.75em 0 0 0;
	padding: 0.3em 1.33em 0.3em 0;
}
#login .fa-spinner {
	visibility: hidden;
}
#login .loading .fa-spinner {
	visibility: visible;
}
#login .loading .fa-openid {
	display: none;
}
#login .loading .fa-user-slash {
	display: none;
}
</style>
