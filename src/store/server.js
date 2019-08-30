import { OpenEO } from '@openeo/js-client';
import { ProcessRegistry } from '@openeo/js-commons';
import Utils from '../utils.js';

const getDefaultState = () => {
	return {
		connection: null,
		requireAuthentication: true,
		userId: null,
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
		capabilities: (state) => state.connection !== null ? state.connection.capabilities() : null,
		supports: (state) => (feature) => state.connection !== null && state.connection.capabilities() !== null && state.connection.capabilities().hasFeature(feature),
		formatCurrency: (state) => (amount) => {
			var currency = '';
			if (state.connection && state.connection.capabilities().currency() !== null) {
				currency = ' ' + state.connection.capabilities().currency();
			}
			return amount + currency;
		},
		isConnected: (state) => state.connection !== null && (!state.requireAuthentication || state.userId !== null),
		isAuthenticated: (state) => state.connection !== null && state.userId !== null,
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
		async connect({commit}, {url, requireAuthentication}) {
			commit('reset');
			try {
				var connection = await OpenEO.connect(url);
				commit('connection', connection);
			} catch (error) {
				if(error.message == 'Network Error' || error.name == 'NetworkError') {
					error = new Error("Server is not available.");
				}
				commit('setConnectionError', error);
				return false;
			}

			var promises = [];
	
			var capabilities = connection.capabilities();
			// Request collections
			if (capabilities.hasFeature('listCollections')) {
				promises.push(connection.listCollections()
					.then(response => commit('collections', response))
					.catch(error => commit('addDiscoveryError', error)));
			}
			else {
				commit('addDiscoveryError', new Error("Collections not supported by the back-end."));
			}

			// Request processes
			if (capabilities.hasFeature('listProcesses') ) {
				promises.push(connection.listProcesses()
					.then(response => commit('processes', response))
					.catch(error => commit('addDiscoveryError', error)));
			}
			else {
				commit('addDiscoveryError', new Error("Processes not supported by the back-end."));
			}

			// Request supported output formats
			if (capabilities.hasFeature('listFileTypes')) {
				promises.push(connection.listFileTypes()
					.then(response => commit('outputFormats', response))
					.catch(error => commit('addDiscoveryError', error)));
			}

			// Request supported service types
			if (capabilities.hasFeature('listServiceTypes')) {
				promises.push(connection.listServiceTypes()
					.then(response => commit('serviceTypes', response))
					.catch(error => commit('addDiscoveryError', error)));
			}
	
			await Promise.all(promises);

			// Do this at the end to make sure isConnected is only true once everything is loaded.
			commit('requireAuthentication', requireAuthentication);

			return true;
		},

		async authenticateOIDC(cx, {clientId, redirectUri}) {
			if (cx.getters.supports('authenticateOIDC')) {
				await cx.state.connection.authenticateOIDC(clientId, redirectUri, true);
//				cx.commit('userId', cx.state.connection.getUserId());
			}
			else {
				throw "Sorry, OpenID Connect authentication is not supported.";
			}
		},

		async authenticateBasic(cx, {username, password}) {
			if (cx.getters.supports('authenticateBasic')) {
				await cx.state.connection.authenticateBasic(username, password);
				cx.commit('userId', cx.state.connection.getUserId());
			}
			else {
				throw "Sorry, Basic authentication is not supported.";
			}
		},

		// Request user account info
		async describeAccount(cx) {
			if (cx.getters.supports('describeAccount') && cx.state.userId) {
				var response = await cx.state.connection.describeAccount();
				cx.commit('userInfo', response);
			}
			else {
				cx.commit('userInfo', {
					userId: cx.state.userId
				});
			}
		}
	},
	mutations: {
		requireAuthentication(state, requireAuth = true) {
			state.requireAuthentication = requireAuth;
		},
		connection(state, connection) {
			state.connection = connection;
		},
		userId(state, userId) {
			state.userId = userId;
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