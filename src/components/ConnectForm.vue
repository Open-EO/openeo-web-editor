<template>
	<div class="connectPage">
		<Logo />
		<div class="connectContainer">
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
					<div v-if="allowOtherServers" class="switch"><a @click="switchServer()">Switch server</a></div>
				</div>
			</transition>
		</div>
	</div>
</template>

<script>
import EventBusMixin from './EventBusMixin.vue';
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
		...Utils.mapState(['connectionError', 'discoveryErrors', 'authProviders', 'isAuthenticated']),
		...Utils.mapGetters(['isConnected', 'isDiscovered', 'title']),
		...Utils.mapState('editor', ['storedServers']),
		isLocal() {
			return Boolean(
				window.location.hostname === 'localhost' ||
				window.location.hostname === '[::1]' ||
				window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
			);
		},
		httpsUrl() {
			if (this.$config.showHttpWarning && !this.isLocal && window.location.protocol === 'http:') {
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
				return this.userOidcClientId || this.$config.oidcClientIds[this.provider.id] || this.provider.defaultClient;
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
				popupWindowFeatures: 'location=no,toolbar=no,width=750,height=550,left=50,top=50'
			},
			oidcRedirectUrl: OidcProvider.redirectUrl
		};
	},
	async created() {
		var serverFromQuery = Utils.param('server');
		if (Utils.isUrl(serverFromQuery)) {
			this.serverUrl = serverFromQuery;
		}

		if (this.serverUrl) {
			this.autoConnect = true;
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
		this.listen('viewLogs', this.showErrors);
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
			window.history.pushState({reset: true, serverUrl: this.serverUrl, autoConnect: true}, "", ".");
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

		showErrors(error) {
			// ToDo: Show Modal with Logs component?
			alert(`Close this popup and press the 'F12' key to open the Browser console for more details.`);
		},

		async submitForm() {
			if (!this.isConnected) {
				this.initConnection(this.skipLogin, false);
			}
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
				if (await this.connect(this.serverUrl)) {
					this.addServer(this.serverUrl);
					if (!programmatically) {
						window.history.pushState({reset: true, serverUrl: this.serverUrl, autoConnect: true}, "", ".?server=" + this.serverUrl);
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
					if (this.oidcClientId) {
						this.provider.setClientId(this.oidcClientId);
					}
					await provider.login(this.oidcOptions);
					provider.addListener('AccessTokenExpired', () => Utils.warn(this, "User session has expired, please login again."));
					provider.addListener('SilentRenewError', () => Utils.error(this, "You'll be switching to Guest mode in less than a minute.", "Session renewal failed"));
				}
				else { // noauth/discovery
					window.history.pushState({reset: true, serverUrl: this.serverUrl, autoConnect: true, skipLogin: true}, "", ".?server=" + this.serverUrl + "&discover=1");
					// Delay info a bit to show after transition only and also avoid flickering
					window.setTimeout(
						() => Utils.info(this, 'You are working as a guest. Your data will be publicly available!'),
						1000
					);
				}
			} catch(error) {
				if (authType === 'basic') {
					Utils.error(this, 'Sorry, credentials are wrong.');
				}
				// Special case: Handle oidc-client-js
				else if (authType === 'oidc' && error.name === 'ErrorResponse' && typeof error.error_description === 'string') {
					Utils.error(this, error.error_description.replace(/\+/g, ' '));
				}
				else {
					Utils.exception(this, error);
				}
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
	padding: 0.3em 1.33em 0.3em 0;
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