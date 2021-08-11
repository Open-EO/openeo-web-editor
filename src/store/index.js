import Vue from 'vue';
import Vuex from 'vuex';

import { OpenEO, FileTypes, Formula } from '@openeo/js-client';
import { ProcessRegistry } from '@openeo/js-commons';
import Utils from '../utils.js';
import Process from '../process.js';
import Config from '../../config';
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
		activeRequests: 0,
		discoveryCompleted: false,
		isAuthenticated: false,
		userInfo: {},
		connectionError: null,
		discoveryErrors: [],
		authProviders: [],
		fileFormats: {},
		serviceTypes: {},
		udfRuntimes: {},
		processesUpdated: 0,
		collections: [],
		processNamespaces: Config.processNamespaces || [],
		operatorMapping: Formula.operatorMapping,
		arrayOperatorMapping: {
			'product': '*',
			'sum': '+'
		}
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
		currency: (state) => {
			var currency = '';
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
			var collection = state.collections.find(c => c.id === id);
			if (!Utils.isObject(collection)) {
				return {};
			}

			var spatial_extent = null;
			try {
				spatial_extent = Utils.extentToBBox(collection.extent.spatial.bbox[0]);
			} catch (error) {}

			var temporal_extent = null;
			try {
				// Only supports temporal ranges with start and end date.
				// All other temporal extents will be unbounded for now.
				// ToDo: Support open date ranges: https://github.com/mengxiong10/vue2-datepicker/issues/612
				temporal_extent = collection.extent.temporal.interval[0].filter(date => date !== null);
				if (temporal_extent.length !== 2) {
					temporal_extent = null;
				}
			} catch (error) {}
	
			var bands = null;
			return {id, spatial_extent, temporal_extent, bands};
		},
		processes: (state) => state.processesUpdated && state.connection !== null ? state.connection.processes : new ProcessRegistry(),
		reverseOperatorMapping: (state) => {
			let mapping = {};
			for(var op in state.operatorMapping) {
				mapping[state.operatorMapping[op]] = op;
			}
			return Object.assign(mapping, state.arrayOperatorMapping);
		},
		supportsMath: (state, getters) => {
			for(let i in state.operatorMapping) {
				let processId = state.operatorMapping[i];
				if (!getters.processes.has(processId)) {
					return false;
				}
			}
			return true;
		},
		isMathProcess: (state, getters) => (process) => {
			if (!Utils.isObject(process) || Utils.size(process.process_graph) === 0) {
				return null;
			}
			let unsupportedFuncs = Object.values(process.process_graph).find(node => !getters.readableMathProcesses.includes(node.process_id));
			if (unsupportedFuncs !== undefined) {
				return false;
			}
			return true;
		},
		mathProcesses: (state, getters) => {
			return getters.processes.all().filter(Process.isMathProcess);
		},
		readableMathProcesses: (state, getters) => {
			return getters.mathProcesses.map(p => p.id)
					.concat(Object.values(state.operatorMapping))
					.concat(Object.keys(state.arrayOperatorMapping))
					.concat(['array_element']);
		}
	},
	actions: {
		async connect(cx, url) {
			await cx.dispatch('logout');

			// Connect and request capabilities
			var connection = null;
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
				var providers = await connection.listAuthProviders();
				cx.commit('authProviders', providers);
			} catch (error) {
				cx.commit('setConnectionError', error);
				return false;
			}

			connection.on('authProviderChanged', provider => cx.commit('authenticated', provider !== null));
			connection.on('processesChanged', () => cx.commit('updateProcesses'));

			// Only commit the connection change after requesting the auth providers
			// as this indicates that the connection procedure has finished.
			cx.commit('connection', connection);

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
			if (capabilities.hasFeature('listProcesses')) {
				promises.push(cx.state.connection.listProcesses()
					.catch(error => cx.commit('addDiscoveryError', error)));
			}
			else {
				cx.commit('addDiscoveryError', new Error("Pre-defined processes not supported by the back-end."));
			}

			// Request processes from namespaces
			if (cx.state.processNamespaces.length > 0) {
				for(let namespace of cx.state.processNamespaces) {
					promises.push(cx.state.connection.listProcesses(namespace)
						.catch(error => cx.commit('addDiscoveryError', error)));
				}
			}

			// Request custom processes
			if (capabilities.hasFeature('listUserProcesses') && cx.state.connection.isAuthenticated()) {
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

			// Request supported UDF runtimes
			if (capabilities.hasFeature('listUdfRuntimes')) {
				promises.push(cx.state.connection.listUdfRuntimes()
					.then(response => cx.commit('udfRuntimes', response))
					.catch(error => cx.commit('addDiscoveryError', error)));
			}

			// Request user account information
			var promise = cx.dispatch('describeAccount')
				.catch(error => cx.commit('addDiscoveryError', error));
			promises.push(promise);

			await Promise.all(promises);

			// Request initial process
			try {
				await cx.dispatch('editor/loadInitialProcess');
			} catch (error) {
				cx.commit('addDiscoveryError', error)
			}

			cx.commit('discoveryCompleted');
		},

		// Request user account info
		async describeAccount(cx) {
			if (cx.getters.supports('describeAccount') && cx.state.isAuthenticated) {
				var response = await cx.state.connection.describeAccount();
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
				cx.commit('fillCollection', collection);
			}
			return collection;
		},

		async loadProcess(cx, {id, namespace}) {
			process = cx.getters.processes.get(id, namespace);
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

		async logout(cx, disconnect = false) {
			if (cx.state.isAuthenticated) {
				// Logout (mostly for OIDC)
				var authProvider = cx.state.connection.getAuthProvider();
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
				.filter(c => (typeof c.id === 'string'))
				.sort(Utils.sortById);
		},
		setConnectionError(state, error) {
			state.connectionError = error;
		},
		addDiscoveryError(state, error) {
			state.discoveryErrors.push(error);
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
		}
	}
});