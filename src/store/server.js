import { OpenEO } from '@openeo/js-client';
import { ProcessRegistry } from '@openeo/js-commons';
import Utils from '../utils.js';

const getDefaultState = () => {
	return {
		connection: null,
		discoveryCompleted: false,
		userInfo: {},
		connectionError: null,
		discoveryErrors: [],
		outputFormats: {},
		serviceTypes: {},
		processes: [],
		collections: []
	};
};

export default {
	namespaced: true,
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
		isAuthenticated: (state) => state.connection !== null && state.connection.accessToken !== null,
		processRegistry: (state) => {
			var registry = new ProcessRegistry();
			for (var i in state.processes) {
				registry.add(state.processes[i]);
			}
			return registry;
		},
		supportsBilling: (state) => state.connection !== null && state.connection.capabilities().currency() !== null,
		supportsBillingPlans: (state) => state.connection !== null && state.connection.capabilities().currency() !== null && state.connection.capabilities().listPlans().length > 0
	},
	actions: {
		async connect(cx, {url}) {
			cx.commit('reset');
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
					.then(response => cx.commit('processes', response))
					.catch(error => cx.commit('addDiscoveryError', error)));
			}
			else {
				cx.commit('addDiscoveryError', new Error("Processes not supported by the back-end."));
			}

			// Request supported output formats
			if (capabilities.hasFeature('listFileTypes')) {
				promises.push(cx.state.connection.listFileTypes()
					.then(response => cx.commit('outputFormats', response))
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
					user_id: cx.state.connection.getUserId()
				});
			}
		},

		async logout(cx) {
			// Logout (mostly from OIDC)
			await cx.state.connection.logout();
			// Reset values
			cx.commit('reset');
		},
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
		outputFormats(state, outputFormats) {
			// Make keys uppercase for simplicity
			if (Utils.isObject(outputFormats)) {
				var obj = {};
				for(var key in outputFormats) {
					obj[key.toUpperCase()] = outputFormats[key];
				}
				state.outputFormats = obj;
			}
			else {
				state.outputFormats = outputFormats;
			}
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
		processes(state, data) {
			var processes = [];
			for (var i in data.processes) {
				if (typeof data.processes[i].id === 'undefined') {
					continue;
				}
				processes.push(data.processes[i]);
			}
			processes.sort((a, b) => a.id.localeCompare(b.id));
			state.processes = processes;
		},
		collections(state, data) {
			var collections = [];
			for (var i in data.collections) {
				if (typeof data.collections[i].id === 'undefined') {
					continue;
				}
				collections.push(data.collections[i]);
			}
			collections.sort((a, b) => a.id.localeCompare(b.id));
			state.collections = collections;
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
};