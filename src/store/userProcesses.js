import storeFactory from './storeFactory';
import Utils from '../utils';

export default storeFactory({
	namespace: 'userProcesses',
	listFn: 'listUserProcesses',
	paginateFn: null,
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
					.map(p => Object.assign(p, {namespace: 'user'}))
					.filter(p => (typeof p.id === 'string'))
					.sort(Utils.sortById);
			}
		}
	}
});