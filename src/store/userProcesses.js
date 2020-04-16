import storeFactory from './storeFactory';
import Utils from '../utils';
import Vue from 'vue';

export default storeFactory({
	namespace: 'userProcesses',
	listFn: 'listUserProcesses',
	createFn: 'setUserProcess',
	updateFn: 'replaceUserProcess',
	deleteFn: 'deleteUserProcess',
	readFn: 'describeUserProcess',
	readFnById: 'getUserProcess',
	customizations: {
		getters: {
			getAllById: (state, getters, rootState) => (id) => {
				let customProcess = getters.getById(id);
				if (customProcess !== null) {
					return customProcess;
				}
				for(let process of rootState.predefinedProcesses) {
					if (process.id === id) {
						return process;
					}
				}
				return null;
			},
		},
		actions: {
		},
		mutations: {
			data(state, data) {
				state.userProcesses = data
					.filter(p => (typeof p.id === 'string'))
					.sort(Utils.sortById);
	
				for(let key in state.userProcesses) {
					Vue.set(state.index, state.userProcesses[key].id, key);
				}
			}
		}
	}
});