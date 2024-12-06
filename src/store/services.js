import storeFactory from './storeFactory';

export default storeFactory({
	namespace: 'services',
	listFn: 'listServices',
	paginateFn: 'paginateServices',
	createFn: 'createService',
	updateFn: 'updateService',
	deleteFn: 'deleteService',
	readFn: 'describeService',
	readFnById: 'getService',
	customizations: {
		getters: {
		},
		actions: {
		},
		mutations: {
		}
	}
});