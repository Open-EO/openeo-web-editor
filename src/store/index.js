import Vue from 'vue';
import Vuex from 'vuex';

import { OpenEO } from '@openeo/js-client';
import { ProcessRegistry } from '@openeo/js-processgraphs';
import Utils from '../utils.js';
// Sub-modules
import editor from './editor';
import files from './files';
import jobs from './jobs';
import services from './services';
import userProcesses from './userProcesses';

Vue.use(Vuex);

const getDefaultState = () => {
	return {
		connection: null,
		discoveryCompleted: false,
		userInfo: {},
		connectionError: null,
		discoveryErrors: [],
		fileFormats: {},
		serviceTypes: {},
		predefinedProcesses: [],
		collections: []
	};
};

export default new Vuex.Store({
//	strict: true,
	modules: {
		editor,
		files,
		jobs,
		services,
		userProcesses
	},
	state: getDefaultState(),
	getters: {
		title: (state) => {
			if (state.connection !== null && state.connection.capabilities() !== null) {
				var title = state.connection.capabilities().title();
				return title ? title : state.connection.getBaseUrl();
			}
			return null;
		},
		capabilities: (state) => state.connection !== null ? state.connection.capabilities() : null,
		supports: (state) => (feature) => state.connection !== null && state.connection.capabilities() !== null && state.connection.capabilities().hasFeature(feature),
		formatCurrency: (state) => (amount) => {
			var currency = '';
			if (state.connection && state.connection.capabilities().currency() !== null) {
				currency = ' ' + state.connection.capabilities().currency();
			}
			return amount + currency;
		},
		isConnected: (state) => state.connection !== null && state.connection.capabilities() !== null,
		isDiscovered: (state) => state.connection !== null && state.discoveryCompleted,
		isAuthenticated: (state) => state.connection !== null && state.connection.isAuthenticated(),
		supportsBilling: (state) => state.connection !== null && state.connection.capabilities().currency() !== null,
		supportsBillingPlans: (state) => state.connection !== null && state.connection.capabilities().currency() !== null && state.connection.capabilities().listPlans().length > 0,
		apiVersion: (state) => state.connection !== null ? state.connection.capabilities().apiVersion() : null,
		processRegistry: (state) => {
			var registry = new ProcessRegistry();
			for (let process of state.predefinedProcesses) { // pre-defined processes as plain object
				registry.add(process);
			}
			for(let process of state.userProcesses.userProcesses) { // user-defined processes as UserProcess object
				registry.add(process.toJSON());
			}
			return registry;
		}
	},
	actions: {
		async connect(cx, {url}) {
			await cx.dispatch('logout');
			try {
				var connection = await OpenEO.connect(url);
				cx.commit('connection', connection);
			} catch (error) {
				if(error.message == 'Network Error' || error.name == 'NetworkError') {
					error = new Error("Server is not available.");
				}
				cx.commit('setConnectionError', error);
				return false;
			}

			return true;
		},

		async discover(cx) {
			var promises = [];
			var capabilities = cx.state.connection.capabilities();

			// Request collections
			if (capabilities.hasFeature('listCollections')) {
				promises.push(cx.state.connection.listCollections()
					.then(response => cx.commit('collections', response))
					.catch(error => cx.commit('addDiscoveryError', error)));
			}
			else {
				cx.commit('addDiscoveryError', new Error("Collections not supported by the back-end."));
			}

			// Request processes
			if (capabilities.hasFeature('listProcesses') ) {
				promises.push(cx.state.connection.listProcesses()
					.then(response => cx.commit('predefinedProcesses', response))
					.catch(error => cx.commit('addDiscoveryError', error)));
			}
			else {
				cx.commit('addDiscoveryError', new Error("Pre-defined processes not supported by the back-end."));
			}

			// Request custom processes
			if (capabilities.hasFeature('listUserProcesses') ) {
				promises.push(cx.dispatch('userProcesses/list')
					.catch(error => cx.commit('addDiscoveryError', error)));
			}

			// Request supported output formats
			if (capabilities.hasFeature('listFileTypes')) {
				promises.push(cx.state.connection.listFileTypes()
					.then(response => cx.commit('fileFormats', response))
					.catch(error => cx.commit('addDiscoveryError', error)));
			}

			// Request supported service types
			if (capabilities.hasFeature('listServiceTypes')) {
				promises.push(cx.state.connection.listServiceTypes()
					.then(response => cx.commit('serviceTypes', response))
					.catch(error => cx.commit('addDiscoveryError', error)));
			}

			// Request user account information
			var promise = cx.dispatch('describeAccount')
				.catch(error => cx.commit('addDiscoveryError', error));
			promises.push(promise);

			await Promise.all(promises);

			cx.commit('discoveryCompleted', true);
		},

		async authenticateOIDC(cx, options) {
			if (cx.getters.supports('authenticateOIDC')) {
				await cx.state.connection.authenticateOIDC(options);
			}
			else {
				throw "Sorry, OpenID Connect authentication is not supported.";
			}
		},

		async authenticateBasic(cx, {username, password}) {
			if (cx.getters.supports('authenticateBasic')) {
				await cx.state.connection.authenticateBasic(username, password);
			}
			else {
				throw "Sorry, Basic authentication is not supported.";
			}
		},

		// Request user account info
		async describeAccount(cx) {
			if (cx.getters.supports('describeAccount') && cx.getters.isAuthenticated) {
				var response = await cx.state.connection.describeAccount();
				cx.commit('userInfo', response);
			}
			else {
				cx.commit('userInfo', {
					user_id: 'Guest'
				});
			}
		},

		async logout(cx) {
			if (cx.getters.isAuthenticated) {
				// Logout (mostly for OIDC)
				var authProvider = cx.state.connection.getAuthProvider();
				if (authProvider !== null) {
					await authProvider.logout();
				}
			}
			// Reset values
			cx.commit('reset');
			cx.commit('jobs/reset');
			cx.commit('files/reset');
			cx.commit('services/reset');
		}
	},
	mutations: {
		discoveryCompleted(state) {
			state.discoveryCompleted = true;
		},
		connection(state, connection) {
			state.connection = connection;
		},
		userInfo(state, info) {
			state.userInfo = info;
		},
		fileFormats(state, fileFormats) {
			state.fileFormats = fileFormats;
		},
		serviceTypes(state, serviceTypes) {
			// Make keys uppercase for simplicity
			if (Utils.isObject(serviceTypes)) {
				var obj = {};
				for(var key in serviceTypes) {
					obj[key.toUpperCase()] = serviceTypes[key];
				}
				state.serviceTypes = obj;
			}
			else {
				state.serviceTypes = serviceTypes;
			}
		},
		predefinedProcesses(state, data) {
			state.predefinedProcesses = data.processes
				.filter(p => (typeof p.id === 'string'))
				.sort(Utils.sortById);
		},
		collections(state, data) {
			state.collections = data.collections
				.filter(c => (typeof c.id === 'string'))
				.sort(Utils.sortById);
		},
		setConnectionError(state, error) {
			state.connectionError = error;
		},
		addDiscoveryError(state, error) {
			state.discoveryErrors.push(error);
		},
		reset(state) {
			Object.assign(state, getDefaultState());
		}
	}
});