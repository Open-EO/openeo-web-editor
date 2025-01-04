import { UserProcess } from '@openeo/js-client';
import { Utils } from '@openeo/js-commons';
import Vue from 'vue';

export default ({namespace, listFn, paginateFn, createFn, updateFn, deleteFn, readFn, readFnById, customizations, primaryKey}) => {
	if (!primaryKey) {
		primaryKey = 'id';
	}
	const getDefaultState = () => {
		return {
			pages: null,
			hasMore: false,
			[namespace]: []
		};
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
			async create(cx, parameters) {
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
				const count = cx.state[namespace].length;
				if (cx.getters.supportsList) {
					// Pass over existing data so that it can be updated (for all complete entities, only update fields that exist in the new object)
					// instead of getting replaced, see https://github.com/Open-EO/openeo-web-editor/issues/234
					let pageLimit = Math.max(cx.rootState.pageLimit, count);
					if (paginateFn) {
						const pages = cx.rootState.connection[paginateFn](pageLimit, cx.state[namespace]);
						const data = await pages.nextPage();
						cx.commit('reset'); // Keep close to the update to avoid flickering
						cx.commit('pages', pages);
						cx.commit('data', data);
					}
					else {
						const data = await cx.rootState.connection[listFn](cx.state[namespace]);
						cx.commit('reset'); // Keep close to the update to avoid flickering
						cx.commit('data', data);
					}
				}
				return cx.state[namespace];
			},
			async nextPage(cx) {
				if (!cx.state.pages || !cx.state.hasMore) {
					return;
				}
				cx.commit('data', await cx.state.pages.nextPage());
				return cx.state[namespace];
			}
		},
		mutations: {
			data(state, data) {
				if (Array.isArray(data)) {
					for (let d of data) {
						state[namespace].push(d);
					}
				}
				state.hasMore = state.pages ? state.pages.hasNextPage() : false;
			},
			pages(state, pages) {
				state.pages = pages;
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