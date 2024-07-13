<template>
	<div class="connectPage">
		<Logo />
		<div class="connectContainer">
			<div class="helpBtn" @click="showHelp" title="Show help"><i class="fas fa-question fa-fw"></i> Help</div>
			<div v-if="httpsUrl" class="message error">
				<i class="fas fa-shield-alt"></i>
				<span>You are using an <strong>insecure</strong> HTTP connection, which is not encrypted. Please use HTTPS if possible.<br />
				<a :href="httpsUrl">Click here to switch to a secured HTTPS connection.</a></span>
			</div>
			<div v-if="message" class="message warning">
				<i class="fas fa-bullhorn"></i>
				<span v-html="message"></span>
			</div>
			<transition name="connect-fade" mode="out-in" @before-enter="initProviders">
				<form @submit.prevent="submitForm" v-if="showConnectForm" class="connect">
					<h3>Connect to server</h3>
					<div class="row">
						<label for="serverUrl">URL:</label>
						<div class="input">
							<input type="text" id="serverUrl" class="tour-connect-url" v-model.lazy.trim="serverUrl" :disabled="autoConnect" />
							<button v-if="allowOtherServers" type="button" @click="showServerSelector" title="Select previously used server" class="tour-connect-history"><i class="fas fa-book"></i></button>
						</div>
					</div>
					<div class="row">
						<button type="submit" class="connectBtn tour-connect-retry" :class="{loading: loading}"><i class="fas fa-spinner fa-spin fa-lg"></i> Connect</button>
					</div>
				</form>
				<div v-else-if="showLoginForm" class="login">
					<h3>Log in to {{ title }}</h3>
					<Tabs id="credentials" ref="providers" :pills="true" :pillsMultiline="true" @selected="providerSelected">
						<template #dynamic="{ tab }">
							<form @submit.prevent="initDiscovery(tab.data)">
								<div class="row help" v-if="tab.data.description">
									<i class="fas fa-info-circle"></i>
									<span>{{ tab.data.description }}</span>
								</div>
								<template v-if="!hasPredefinedOidcClientId">
									<div class="row">
										<label for="password">Client ID:</label>
										<input type="text" class="input" v-model.trim="userOidcClientId" required="required" />
									</div>
									<div class="row help">
										<i class="fas fa-exclamation-circle"></i>
										<span>You need to specify the <em>Client ID</em> provided to you by the provider. You need to allow the <a :href="oidcRedirectUrl" target="_blank" :title="oidcRedirectUrl">URL of this service</a> as redirect URL with the authentication service.</span>
									</div>
								</template>
								<div class="row bottom">
									<TermsOfServiceConsent />
									<div class="row help">
										<i class="fas fa-window-restore"></i>
										<span>Clicking the button below may open a new window for login.</span>
									</div>
									<button type="submit" class="connectBtn" :class="{loading: loading}"><i class="fas fa-spinner fa-spin fa-lg"></i><i class="fab fa-openid"></i> Log in with {{ tab.name }}</button>
								</div>
							</form>
						</template>
						<template v-if="basicProvider" #basic="{ tab }">
							<form @submit.prevent="initDiscovery(tab.data)">
								<div class="row help">
									<i class="fas fa-info-circle"></i>
									<span>The <tt>HTTP Basic</tt> authentication method is mostly used for development and testing purposes.</span>
								</div>
								<div class="row">
									<label for="username">Username:</label>
									<input class="input" id="username" type="text" v-model.trim="username" required="required" />
								</div>
								<div class="row">
									<label for="password">Password:</label>
									<input class="input" id="password" type="password" v-model.trim="password" required="required" />
								</div>
								<div class="row bottom">
									<TermsOfServiceConsent />
									<button type="submit" class="connectBtn" :class="{loading: loading}"><i class="fas fa-spinner fa-spin fa-lg"></i> Log in</button>
								</div>
							</form>
						</template>
						<template #noauth>
							<form @submit.prevent="initDiscovery()">
								<div class="row help">
									<i class="fas fa-info-circle"></i>
									<span>Choose this if you don't have credentials for the service provider and just want to explore the service with its available data and processes. You may not be able to process any data.</span>
								</div>
								<div class="row bottom">
									<TermsOfServiceConsent />
									<button type="submit" class="connectBtn" :class="{loading: loading}"><i class="fas fa-spinner fa-spin fa-lg"></i><i class="fas fa-user-slash"></i> Proceed without logging in</button>
								</div>
							</form>
						</template>
					</Tabs>
					<div v-if="allowOtherServers" class="switch tour-login-switch"><a @click="switchServer()">Switch server</a></div>
				</div>
			</transition>
		</div>
	</div>
</template>

<script>
import EventBusMixin from './EventBusMixin.js';
import Logo from './Logo.vue';
import Tabs from '@openeo/vue-components/components/Tabs.vue';
import Tab from '@openeo/vue-components/components/Tab.vue';
import TermsOfServiceConsent from './TermsOfServiceConsent.vue';
import Utils from '../utils.js';
import { OidcProvider } from '@openeo/js-client';

export default {
	name: 'ConnectForm',
	mixins: [EventBusMixin],
	components: {
		Logo,
		Tabs,
		Tab,
		TermsOfServiceConsent
	},
	props: {
		skipLogin: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		...Utils.mapState(['connectionError', 'authProviders', 'isAuthenticated']),
		...Utils.mapGetters(['isConnected', 'isDiscovered', 'title']),
		...Utils.mapState('editor', ['storedServers']),
		httpsUrl() {
			if (this.$config.showHttpWarning && !this.isLocalUrl(window.location) && window.location.protocol === 'http:') {
				return window.location.toString()
					.replace(/^http:/i, 'https:')
					.replace(/([\?&]server=http)(:|%3A)/, '$1s$2');
			}
			
			return null;
		},
		hasPredefinedOidcClientId() {
			if (this.provider && this.provider.getType() === 'oidc') {
				return Boolean(this.provider.defaultClient || this.$config.oidcClientIds[this.provider.id]);
			}
			return false;
		},
		oidcClientId() {
			if (this.provider && this.provider.getType() === 'oidc') {
				return this.userOidcClientId || this.$config.oidcClientIds[this.provider.id] || null;
			}
			return null;
		},
		oidcProviders() {
			return this.authProviders.filter(obj => obj.getType() === 'oidc');
		},
		basicProvider() {
			return this.authProviders.find(obj => obj.getType() === 'basic') || null;
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
				this.broadcast('title', 'Connect to server');
			}
			this.broadcast('stopTour');
		},
		showLoginForm(newVal) {
			if (newVal) {
				this.broadcast('title', 'Log in');
			}
			this.broadcast('stopTour');
		}
	},
	data() {
		var w = 500, h = 500, l = 50, t = 50; // default sizes and positions
		if (window.screen && window.screen.availWidth > 0 && window.screen.availHeight > 0) {
			// try to use 80% of av. screen width (and height)
			w = Math.max(window.screen.availWidth * 0.8, w);
			h = Math.max(window.screen.availHeight * 0.8, h);
			l = window.screen.availWidth * 0.1;
			t = window.screen.availHeight * 0.1;
		}
		return {
			serverUrl: this.$config.serverUrl,
			allowOtherServers: !this.$config.serverUrl,
			autoConnect: false,
			username: '',
			password: '',
			provider: null,
			loading: false,
			message: this.$config.loginMessage,
			userOidcClientId: '',
			oidcOptions: {
				automaticSilentRenew: true,
				popupWindowFeatures: `location=no,toolbar=no,width=${w},height=${h},left=${l},top=${t}`
			},
			oidcRedirectUrl: OidcProvider.redirectUrl
		};
	},
	async created() {
		var serverFromQuery = Utils.param('server');
		if (!this.$config.serverUrl && serverFromQuery) {
			this.serverUrl = serverFromQuery;
		}

		if (this.serverUrl) {
			this.autoConnect = true;
		}

		// Allow enforcing a re-login with e.g. 'prompt=login' parameter on authentication request.
		// See https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest
		let prompt = Utils.param('oidc~prompt');
		if (['none', 'login', 'consent', 'select_account'].includes(prompt)) {
			this.oidcOptions.prompt = prompt;
		}

		// Do this after the other initial work as the await delays execution and makes mounted run before created sometimes.
		OidcProvider.uiMethod = 'popup';
		try {
			await OidcProvider.signinCallback();
		} catch (error) {
			if (error instanceof Error && error.message !== "No state in response") {
				Utils.exception(this, error);
			}
		}
	},
	mounted() {
		window.onpopstate = evt => this.historyNavigate(evt);
		window.history.replaceState({reset: true, serverUrl: this.serverUrl}, "");
		this.initProviders();
		if (this.autoConnect) {
			this.submitForm();
		}
	},
	methods: {
		...Utils.mapActions(['connect', 'discover', 'logout']),
		...Utils.mapMutations(['reset']),
		...Utils.mapMutations('editor', ['addServer', 'removeServer']),

		isLocalUrl(url) {
			return Boolean(
				url.hostname === 'localhost' ||
				url.hostname === '[::1]' ||
				url.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
			);
		},

		showHelp() {
			if (!this.isConnected) {
				this.broadcast('showTour', 'connect');
			} else {
				this.broadcast('showTour', 'login');
			}
		},

		historyNavigate(evt) {
			if (!Utils.isObject(evt.state) || evt.state.reset) {
				this.logout(true);
				this.autoConnect = false;
				this.loading = false;
				this.password = '';
			}
			if (Utils.isObject(evt.state)) {
				if (evt.state.serverUrl) {
					this.serverUrl = evt.state.serverUrl;
				}
				if (typeof evt.state.autoConnect !== 'undefined') {
					this.autoConnect = evt.state.autoConnect;
				}
			}
			if (this.autoConnect) {
				this.initConnection(!!evt.state.skipLogin, true);
			}
		},

		switchServer() {
			window.history.pushState({reset: true, serverUrl: this.serverUrl, autoConnect: true}, "", this.makeUrl(false));
			this.serverUrl = null;
			this.autoConnect = false;
			this.reset();
		},

		initProviders() {
			if (this.$refs.providers && this.$refs.providers.tabs.length === 0) {
				this.addProviders();
			}
		},
		addProviders() {
			for(var provider of this.oidcProviders) {
				this.$refs.providers.addTab(provider.getTitle(), null, provider, provider.getId(), false, false);
			}
			if(this.basicProvider) {
				this.$refs.providers.addTab('Internal', null, this.basicProvider, "basic", false, false);
			}
			this.$refs.providers.addTab('No credentials', null, null, "noauth", false, false);
			this.$nextTick(() => this.$refs.providers.resetActiveTab(true));
		},

		providerSelected(tab) {
			this.provider = tab.data;
		},

		async submitForm() {
			if (!this.isConnected) {
				await this.initConnection(this.skipLogin, false);
			}
		},

		async initConnection(skipLogin = false, programmatically = false) {
			if (typeof this.serverUrl !== 'string' || !this.serverUrl) {
				Utils.error(this, 'Please specify a server.');
				return;
			}
			let serverUrl = this.serverUrl;
			if (!serverUrl.match(/^https?:\/\//i)) {
				serverUrl = `https://${serverUrl}`;
			}

			if (!Utils.isUrl(serverUrl)) {
				Utils.error(this, 'The server given is not a valid URL.');
				return;
			}

			const url = new URL(serverUrl);
			if (window.location.protocol === 'https:' && url.protocol !== 'https:' && !this.isLocalUrl(url)) {
				Utils.error(this, 'You are trying to connect to a server with HTTP instead of HTTPS, which is insecure and prohibited by web browsers. Please use HTTPS instead.');
				return;
			}

			this.loading = true;
			try {
				if (await this.connect(serverUrl)) {
					this.addServer(serverUrl);
					if (!programmatically) {
						window.history.pushState({reset: true, serverUrl: this.serverUrl, autoConnect: true, skipLogin}, "", this.makeUrl());
					}
					if (skipLogin) {
						await this.initDiscovery();
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

		async initDiscovery(provider = null) {
			this.loading = true;
			let authType = Utils.isObject(provider) && typeof provider.getType() === 'string' ? provider.getType() : null;
			try {
				if (authType === 'basic') {
					await provider.login(this.username, this.password);
				}
				else if (authType === 'oidc') {
					let offlineScope = true;
					if (this.oidcClientId) {
						this.provider.setClientId(this.oidcClientId);
					}
					else {
						const client = provider.detectDefaultClient();
						offlineScope = client && Array.isArray(client.grant_types) && client.grant_types.includes('refresh_token');
					}
					await provider.login(this.oidcOptions, offlineScope);
					provider.addListener('AccessTokenExpired', () => Utils.warn(this, "User session has expired, please login again."));
					provider.addListener('SilentRenewError', () => Utils.error(this, "You'll be switching to Guest mode in less than a minute.", "Session renewal failed"));
				}
				else { // noauth/discovery
					window.history.pushState({reset: true, serverUrl: this.serverUrl, autoConnect: true, skipLogin: true}, "", this.makeUrl(true, true));
				}
			} catch(error) {
				if (authType === 'basic') {
					Utils.error(this, 'Sorry, credentials are wrong.');
				}
				// Special case: Handle oidc-client-js
				else if (authType === 'oidc' && error.name === 'ErrorResponse' && typeof error.error_description === 'string') {
					Utils.error(this, error.error_description.replace(/\+/g, ' '));
				}
				else if (authType === 'oidc' && (error.message == 'Network Error' || error.name == 'NetworkError')) {
					Utils.error(this, 'Sorry, the authentication server is not available right now.');
				}
				else {
					Utils.exception(this, error);
				}
				this.loading = false;
				return;
			}
			
			let discoveryErrors = await this.discover();
			for(var error of discoveryErrors) {
				Utils.exception(this, error);
			}

			this.loading = false;

			if (this.isAuthenticated) {
				window.history.pushState({reset: true, serverUrl: this.serverUrl, autoConnect: true}, "", this.makeUrl());
			}
		},

		makeUrl(server = true, discover = false) {
			let params = new URLSearchParams(window.location.search);
			if (server && !this.$config.serverUrl) {
				params.set('server', this.serverUrl);
			}
			else {
				params.delete('server');
			}
			if (discover && !this.$config.skipLogin) {
				params.set('discover', 1);
			}
			else if (!discover && this.$config.skipLogin) {
				params.set('discover', 0);
			}
			else {
				params.delete('discover');
			}
			let query = params.toString();
			if (query) {
				return `.?${query}`;
			}
			else {
				return '.';
			}
		},

		showServerSelector() {
			this.broadcast(
				"showListModal",
				"Select previously used server",
				this.storedServers,
				[
					{
						callback: url => {
							this.serverUrl = url;
							return true;  // return true to close the modal
						}
					},
					{
						callback: url => this.removeServer(url),
						icon: 'trash',
						title: 'Delete'
					}
				]
			);
		}
	}
}
</script>

<style lang="scss" scoped>
@import '../../theme.scss';

.connectPage {
	background-color: $mainColor;
	align-items: center;
	justify-content: center;
	display: flex;
	flex-direction: column;
	overflow: auto;
	width: 100%;
	height: 100%;
}
.connectPage .logo {
	max-width: 500px;
	margin-bottom: 1rem;
}
.connectPage .logo img {
	max-height: 150px;
}
.connectContainer {
	width: 500px;
	background-color: white;
	border: 1px solid black;
	border-radius: 3em;
	padding: 2.5em 3em;
	font-family: 'Ubuntu', sans-serif;
}
.connectContainer .helpBtn {
	float: right;
	cursor: pointer;
	color: $linkColor;
	margin-left: 1rem;
}
.connectContainer .helpBtn:hover {
	color: black;
}
header {
	text-align: center;
	margin-bottom: 2em;
}
h3 {
	margin: 0 0 0.75em 0;
}
.switch {
	font-size: 0.9em;
	text-align: center;
	margin-top: 0.5em;
}
.row {
	display: flex;
	margin: 0.25em 0;
}
label {
	width: 30%;
	display: flex;
	align-items: center;
}
.input {
	flex-grow: 1;
	display: flex;
}
.input input {
	flex-grow: 1;
}
input {
	padding: 0.3em;
}
input, button {
	margin: 3px;
}
.connectBtn {
	width: 100%;
	margin: 0;
	margin-top: 0.5em;
	padding: 5px 1.33em 5px 0;
}
.fa-spinner {
	visibility: hidden;
}
.loading .fa-spinner {
	visibility: visible;
}
.loading .fa-openid {
	display: none;
}
.loading .fa-user-slash {
	display: none;
}
</style>

<style>
@media only screen and (min-height: 600px) {
	#credentials.tabs {
		min-height: 250px;
	}
}
#credentials.tabs .tabsHeader {
	margin-bottom: 0.5em;
}
#credentials.tabs {
	display: flex;
}
#credentials.tabs .tabsBody, #credentials.tabs .tabContent, #credentials.tabs form, #credentials.tabs form > div:last-child  {
	flex-grow: 1;
	display: flex;
	flex-direction: column;
}
#credentials.tabs form > div {
	flex-grow: 1;
}
#credentials.tabs form > div.bottom {
	justify-content: flex-end;
}
</style>
