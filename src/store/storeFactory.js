import { UserProcess } from '@openeo/js-client';
import { Utils } from '@openeo/js-commons';
import Vue from 'vue';

export default ({namespace, listFn, createFn, updateFn, deleteFn, readFn, readFnById, customizations, primaryKey}) => {
	if (!primaryKey) {
		primaryKey = 'id';
	}
	const getDefaultState = () => {
		let data = {};
		data[namespace] = [];
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
				let data = state[namespace].find(x => x[primaryKey] === id);
				return typeof data !== 'undefined' ? data : null;
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
				if (!(data instanceof UserProcess)) {
					let id = Utils.isObject(data) ? data[primaryKey] : data;
					// Try to get UserProcess from store
					data = cx.getters.getById(id);
					if (!data) {
						// Try to load UserProcess from Connection
						updated = await cx.rootState.connection[readFnById](data);
					}
				}
				if (!updated) {
					// Try to update UserProcess
					updated = await data[readFn]();
				}
				// Update or insert, depending on previous state
				cx.commit('upsert', updated);
				return updated;
			},
			async list(cx) {
				var data = [];
				if (cx.getters.supportsList) {
					// Pass over existing data so that it can be updated (for all complete entities, only update fields that exist in the new object)
					// instead of getting replaced, see https://github.com/Open-EO/openeo-web-editor/issues/234
					data = await cx.rootState.connection[listFn](cx.state[namespace]);
				}
				cx.commit('data', data);
				return data;
			}
		},
		mutations: {
			data(state, data) {
				state[namespace] = data.map(d => Vue.observable(d));
			},
			upsert(state, data) {
				let id = data[primaryKey];
				let index = state[namespace].findIndex(x => x[primaryKey] === id);
				let observableData = Vue.observable(data);
				if (index >= 0) {
					Vue.set(state[namespace], index, observableData);
				}
				else {
					state[namespace].push(observableData);
				}
			},
			delete(state, data) {
				let id = data[primaryKey];
				let index = state[namespace].findIndex(x => x[primaryKey] === id);
				if (index >= 0) {
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