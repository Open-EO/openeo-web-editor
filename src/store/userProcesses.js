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