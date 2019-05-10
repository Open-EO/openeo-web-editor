import { OpenEO } from '@openeo/js-client';

export default {
	state: {
		connection: null,
		userId: null,
		connectionErrors: [],
		outputFormats: {},
		serviceTypes: {},
		processes: [],
		collections: []
	},
	getters: {
		connection: (state) => state.connection,
		capabilities: (state) => state.connection !== null ? state.connection.capabilities() : null,
		userId: (state) => state.userId,
		collections: (state) => state.collections,
		processes: (state) => state.processes,
		supports: (state) => (feature) => state.connection !== null && state.connection.capabilities() !== null && state.connection.capabilities().hasFeature(feature)
	},
	actions: {
		async connect({commit}, url) {
			commit('resetConnectionErrors');
			try {
				var connection = await OpenEO.connect(url);
				commit('userId', null);
				commit('connection', connection);
			} catch (error) {
				commit('addConnectionsError', error);
			}
	
			var capabilities = connection.capabilities();
			// Request supported output formats
			if (capabilities.hasFeature('listFileTypes')) {
				connection.listFileTypes()
					.then(response => commit('outputFormats', response))
					.catch(error => commit('addConnectionsError', error) && commit('outputFormats', {}))
			}

			// Request supported service types
			if (capabilities.hasFeature('listServiceTypes')) {
				connection.listServiceTypes()
					.then(response => commit('serviceTypes', response))
					.catch(error => commit('addConnectionsError', error) && commit('serviceTypes', {}))
			}

			// Request collections
			if (capabilities.hasFeature('listCollections')) {
				connection.listCollections()
					.then(response => commit('collections', response))
					.catch(error => commit('addConnectionsError', error) && commit('collections', []));
			}

			// Request processes
			if (capabilities.hasFeature('listProcesses') ) {
				connection.listProcesses()
					.then(response => commit('processes', response))
					.catch(error => commit('addConnectionsError', error) && commit('processes', []));
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
		}
	},
	mutations: {
		connection(state, connection) {
			state.connection = connection;
		},
		userId(state, userId) {
			state.userId = userId;
		},
		outputFormats(state, outputFormats) {
			state.outputFormats = outputFormats;
		},
		serviceTypes(state, serviceTypes) {
			state.serviceTypes = serviceTypes;
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
		resetConnectionErrors(state) {
			state.connectionErrors = [];
		},
		addConnectionsError(state, error) {
			state.connectionErrors.push(error);
		}
	}
};