import Vue from 'vue';
import Vuex from 'vuex';

import { OpenEO, FileTypes, Formula } from '@openeo/js-client';
import { ProcessRegistry } from '@openeo/js-commons';
import StacMigrate from '@radiantearth/stac-migrate';
import Utils from '../utils.js';
import ProcessRegistryExtension from '../registryExtension.js';
import Config from '../../config';
// Sub-modules
import editor from './editor';
import files from './files';
import jobs from './jobs';
import services from './services';
import userProcesses from './userProcesses';

Vue.use(Vuex);

Formula.arrayOperatorMapping = {
	'product': '*',
	'sum': '+'
};
Formula.reverseOperatorMapping = (() => {
	const mapping = {};
	for(const op in Formula.operatorMapping) {
		mapping[Formula.operatorMapping[op]] = op;
	}
	return Object.assign(mapping, Formula.arrayOperatorMapping);
})();

const getDefaultState = () => {
	return {
		connection: null,
		activeRequests: 0,
		discoveryCompleted: false,
		isAuthenticated: false,
		userInfo: {},
		connectionError: null,
		beforeLogoutListener: {},
		authProviders: [],
		fileFormats: {},
		serviceTypes: {},
		udfRuntimes: {},
		processesUpdated: 0,
		collections: [],
		processNamespaces: Config.processNamespaces || [],
		pageLimit: Config.pageLimit,
	};
};

export default new Vuex.Store({
//	strict: true, // Can't enable, js-client gets mutated externally
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
				const title = state.connection.capabilities().title();
				return title ? title : state.connection.getUrl();
			}
			return null;
		},
		capabilities: (state) => state.connection !== null ? state.connection.capabilities() : null,
		supports: (state) => (feature) => state.connection !== null && state.connection.capabilities() !== null && state.connection.capabilities().hasFeature(feature),
		currency: (state) => {
			let currency = '';
			if (state.connection && state.connection.capabilities().currency() !== null) {
				currency = state.connection.capabilities().currency();
			}
			return currency;
		},
		isConnected: (state) => state.connection !== null && state.connection.capabilities() !== null,
		isDiscovered: (state) => state.connection !== null && state.discoveryCompleted,
		supportsBilling: (state) => state.connection !== null && state.connection.capabilities().currency() !== null,
		supportsBillingPlans: (state) => state.connection !== null && state.connection.capabilities().currency() !== null && state.connection.capabilities().listPlans().length > 0,
		apiVersion: (state) => state.connection !== null ? state.connection.capabilities().apiVersion() : null,
		fileFormats: (state) => state.fileFormats instanceof FileTypes ? state.fileFormats.toJSON() : {input: {}, output: {}},
		collectionDefaults: (state) => (id) => {
			const collection = state.collections.find(c => c.id === id);
			if (!Utils.isObject(collection)) {
				return {};
			}

			let spatial_extent = null;
			try {
				spatial_extent = Utils.extentToBBox(collection.extent.spatial.bbox[0]);
			} catch (error) {}

			let temporal_extent = null;
			try {
				temporal_extent = collection.extent.temporal.interval[0];
				if (temporal_extent[0] === null && temporal_extent[1] === null) {
					temporal_extent = null;
				}
				else if (temporal_extent[0] == temporal_extent[1]) {
					temporal_extent[1] = null;
				}
			} catch (error) {}
	
			let bands = null;
			return {id, spatial_extent, temporal_extent, bands};
		},
		processes: (state) => {
			let registry
			if (state.processesUpdated && state.connection !== null) {
				registry = state.connection.processes;
			}
			else {
				registry = new ProcessRegistry();
			}
			return Object.assign(registry, ProcessRegistryExtension);
		},
		supportsMath: (state, getters) => {
			if (!state.processesUpdated) {
				return;
			}
			for(let i in Formula.operatorMapping) {
				let processId = Formula.operatorMapping[i];
				if (!getters.processes.has(processId)) {
					return false;
				}
			}
			return true;
		}
	},
	actions: {
		async connect(cx, url) {
			await cx.dispatch('logout');

			// Connect and request capabilities
			let connection = null;
			try {
				connection = await OpenEO.connect(url, {addNamespaceToProcess: true});
			} catch (error) {
				if(error.message == 'Network Error' || error.name == 'NetworkError') {
					error = new Error("Server is not available.");
				}
				cx.commit('setConnectionError', error);
				return false;
			}

			// Request auth provider list
			try {
				const providers = await connection.listAuthProviders();
				cx.commit('authProviders', providers);
			} catch (error) {
				cx.commit('setConnectionError', error);
				return false;
			}

			connection.on('authProviderChanged', async (provider) => {
				cx.commit('authenticated', provider !== null);
				if (cx.state.discoveryCompleted) {
					await cx.dispatch('discover', true);
				}
			});
			connection.on('processesChanged', () => cx.commit('updateProcesses'));

			// Only commit the connection change after requesting the auth providers
			// as this indicates that the connection procedure has finished.
			cx.commit('connection', connection);

			return true;
		},

		async discover(cx, refresh = false) {
			let promises = [];
			let errors = [];
			let capabilities = cx.state.connection.capabilities();

			// Request collections
			if (capabilities.hasFeature('listCollections')) {
				promises.push(cx.state.connection.listCollections()
					.then(response => cx.commit('collections', response))
					.catch(error => errors.push(error)));
			}
			else {
				errors.push(new Error("Collections not supported by the server."));
			}

			if (!refresh) { // Only load on first discovery, otherwise the JS client already refreshes the data
				// Request processes
				if (capabilities.hasFeature('listProcesses')) {
					promises.push(cx.state.connection.listProcesses()
						.catch(error => errors.push(error)));
				}
				else {
					errors.push(new Error("Pre-defined processes not supported by the server."));
				}

				// Request processes from namespaces
				if (cx.state.processNamespaces.length > 0) {
					for(let namespace of cx.state.processNamespaces) {
						promises.push(cx.state.connection.listProcesses(namespace)
							.catch(error => errors.push(error)));
					}
				}

				// Request custom processes
				if (capabilities.hasFeature('listUserProcesses') && cx.state.connection.isAuthenticated()) {
					promises.push(cx.dispatch('userProcesses/list')
						.catch(error => errors.push(error)));
				}
			}

			// Request supported output formats
			if (capabilities.hasFeature('listFileTypes')) {
				promises.push(cx.state.connection.listFileTypes()
					.then(response => cx.commit('fileFormats', response))
					.catch(error => errors.push(error)));
			}

			// Request supported service types
			if (capabilities.hasFeature('listServiceTypes')) {
				promises.push(cx.state.connection.listServiceTypes()
					.then(response => cx.commit('serviceTypes', response))
					.catch(error => errors.push(error)));
			}

			// Request supported UDF runtimes
			if (capabilities.hasFeature('listUdfRuntimes')) {
				promises.push(cx.state.connection.listUdfRuntimes()
					.then(response => cx.commit('udfRuntimes', response))
					.catch(error => errors.push(error)));
			}

			// Request user account information
			const promise = cx.dispatch('describeAccount')
				.catch(error => errors.push(error));
			promises.push(promise);

			await Promise.all(promises);

			// Request initial process
			if (!refresh) {
				try {
					await cx.dispatch('editor/loadInitialProcess');
				} catch (error) {
					errors.push(error);
				}
			}

			// Request results for app mode
			if (!refresh) {
				try {
					await cx.dispatch('editor/loadForAppMode');
				} catch (error) {
					errors.push(error);
				}
			}

			cx.commit('discoveryCompleted');
			return errors;
		},

		// Request user account info
		async describeAccount(cx) {
			if (cx.getters.supports('describeAccount') && cx.state.isAuthenticated) {
				const response = await cx.state.connection.describeAccount();
				cx.commit('userInfo', response);
			}
			else {
				cx.commit('userInfo');
			}
		},

		async describeCollection(cx, id) {
			let collection = cx.state.collections.find(c => c.id === id);
			if (!collection || !collection._loaded) {
				collection = await cx.state.connection.describeCollection(id);
				collection = StacMigrate.collection(collection, false);
				cx.commit('fillCollection', collection);
			}
			return collection;
		},

		async loadProcess(cx, {id, namespace}) {
			const process = cx.getters.processes.get(id, namespace);
			if (!Utils.isObject(process)) {
				return null;
			}
			if (process.namespace !== 'backend') {
				if (process.namespace === 'user') {
					await cx.dispatch('userProcesses/read', {data: process});
				}
				else if (process.namespace && namespace !== 'backend') {
					await cx.state.connection.describeProcess(id, process.namespace);
				}
			}
			return cx.getters.processes.get(id, namespace);
		},

		async beforeLogout(cx) {
			await Promise.all(Object.values(cx.state.beforeLogoutListener).map(listener => listener()));
		},

		async logout(cx, disconnect = false) {
			await cx.dispatch('beforeLogout');

			if (disconnect) {
				// Remove listeners, we don't need them anymore if we connect anyway
				cx.state.connection.off('authProviderChanged');
				cx.state.connection.off('processesChanged');
			}

			if (cx.state.isAuthenticated) {
				// Logout (mostly for OIDC)
				const authProvider = cx.state.connection.getAuthProvider();
				if (authProvider !== null) {
					await authProvider.logout();
				}
			}
			if (disconnect) {
				// Reset values
				cx.commit('reset', this.isAuthenticated);
				cx.commit('jobs/reset');
				cx.commit('files/reset');
				cx.commit('services/reset');
				cx.commit('userProcesses/reset');
			}
			else {
				cx.commit('authenticated', false);
			}
		}
	},
	mutations: {
		discoveryCompleted(state, completed = true) {
			state.discoveryCompleted = completed;
		},
		connection(state, connection) {
			state.connection = connection;
		},
		authProviders(state, authProviders) {
			state.authProviders = authProviders;
		},
		userInfo(state, info) {
			state.userInfo = Utils.isObject(info) ? info : {};
		},
		fileFormats(state, fileFormats) {
			state.fileFormats = fileFormats;
		},
		serviceTypes(state, serviceTypes) {
			// Make keys uppercase for simplicity
			if (Utils.isObject(serviceTypes)) {
				const obj = {};
				for(const key in serviceTypes) {
					obj[key.toUpperCase()] = serviceTypes[key];
				}
				state.serviceTypes = obj;
			}
			else {
				state.serviceTypes = serviceTypes;
			}
		},
		udfRuntimes(state, udfRuntimes) {
			state.udfRuntimes = udfRuntimes;
		},
		updateProcesses(state) {
			state.processesUpdated++;
		},
		addProcessNamespacesToRequest(state, namespaces) {
			if (typeof namespaces === 'string') {
				namespaces = namespaces.split(',');
			}
			if (!Array.isArray(namespaces)) {
				return;
			}

			for(let namespace of namespaces) {
				if (namespace && !state.processNamespaces.includes(namespace)) {
					state.processNamespaces.push(namespace);
				}
			}
		},
		fillCollection(state, data) {
			let index = state.collections.findIndex(c => c.id === data.id);
			if (index !== -1) {
				data._loaded = true;
				Vue.set(state.collections, index, data);
			}
		},
		collections(state, data) {
			state.collections = data.collections
				.map(c => StacMigrate.collection(c, false))
				.filter(c => (typeof c.id === 'string'))
				.sort(Utils.sortById);
		},
		setConnectionError(state, error) {
			state.connectionError = error;
		},
		authenticated(state, isAuthenticated) {
			state.isAuthenticated = isAuthenticated;
			if (!isAuthenticated) {
				state.userInfo = {};
			}
		},
		reset(state, keepConnection = false) {
			Object.assign(state, getDefaultState(), {
				connection: keepConnection ? state.connection : null
			});
		},
		startActiveRequest(state) {
			state.activeRequests += 1;
		},
		endActiveRequest(state) {
			state.activeRequests -= 1;
		},
		beforeLogoutListener(state, {key, listener}) {
			if (typeof listener === 'function') {
				state.beforeLogoutListener[key] = listener;
			}
			else {
				Vue.delete(state.beforeLogoutListener, key);
			}
		}
	}
});