import Vue from 'vue';

export default ({namespace, listFn, createFn, updateFn, deleteFn, readFn, readFnById, customizations, primaryKey}) => {
	if (!primaryKey) {
		primaryKey = 'id';
	}
	const getDefaultState = () => {
		let data = {};
		data[namespace] = [];
		data.index = {};
		return data;
	};
	let definition = {
		namespaced: true,
		state: getDefaultState(),
		getters: {
			supportsList: (state, getters, rootState, rootGetters) => rootGetters.supports(listFn),
			supportsCreate: (state, getters, rootState, rootGetters) => rootGetters.supports(createFn),
			supportsUpdate: (state, getters, rootState, rootGetters) => rootGetters.supports(updateFn),
			supportsDelete: (state, getters, rootState, rootGetters) => rootGetters.supports(deleteFn),
			supportsRead: (state, getters, rootState, rootGetters) => rootGetters.supports(readFn),
			getById: (state) => (id) => {
				let index = state.index[id];
				return index >= 0 ? state[namespace][index] : null;
			}
		},
		actions: {
			async create(cx, {parameters}) {
				if (cx.getters.supportsCreate) {
					let connection = cx.rootState.connection;
					let data = await connection[createFn].apply(connection, parameters);
					cx.commit('upsert', data);
					return data;
				}
				else {
					throw new Error("Adding is not supported by the server.");
				}
			},
			async delete(cx, {data}) {
				if (cx.getters.supportsDelete) {
					await data[deleteFn]();
					cx.commit('delete', data);
				}
				else {
					throw new Error("Deleting is not supported by the server.");
				}
			},
			async update(cx, {data, parameters}) {
				if (cx.getters.supportsUpdate) {
					let updated = await data[updateFn](parameters);
					cx.commit('upsert', updated);
					return updated;
				}
				else {
					throw new Error("Updating is not supported by the server.");
				}
			},
			async read(cx, {data}) {
				let updated = null;
				if (typeof data === 'string' || typeof data === 'number') {
					let obj = cx.getters.get(data);
					// Read by id into a new object
					if (obj === null) {
						updated = await cx.rootState.connection[readFnById](data);
					}
					// Update existing object by id
					else {
						data = obj;
					}
				}
				// Update existing object by reference
				if (updated === null) {
					updated = await data[readFn]();
				}
				// Update or insert, depending on previous state
				cx.commit('upsert', updated);
				return updated;
			},
			async list(cx) {
				var data = [];
				if (cx.getters.supportsList) {
					data = await cx.rootState.connection[listFn]();
				}
				cx.commit('data', data);
				return data;
			}
		},
		mutations: {
			// ToDo: Use Vue.observable on all JS client objects?
			data(state, data) {
				state[namespace] = data;
				for(let key in data) {
					Vue.set(state.index, data[key][primaryKey], key);
				}
			},
			upsert(state, data) {
				let id = data[primaryKey];
				let index = state.index[id];
				if (index >= 0) {
					Vue.set(state[namespace], index, data);
				}
				else {
					Vue.set(state.index, id, state[namespace].length);
					state[namespace].push(data);
				}
			},
			delete(state, data) {
				let id = data[primaryKey];
				let index = state.index[id];
				if (index >= 0) {
					Vue.delete(state.index, id);
					Vue.delete(state[namespace], index);
				}
			},
			reset(state) {
				Object.assign(state, getDefaultState());
			}
		}
	};
	// Override with custom definitions
	for(let key in customizations) {
		Object.assign(definition[key], customizations[key]);
	}
	return definition;
};