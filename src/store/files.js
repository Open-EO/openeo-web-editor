import storeFactory from './storeFactory';

export default storeFactory({
	namespace: 'files',
	listFn: 'listFiles',
	paginateFn: 'paginateFiles',
	createFn: 'uploadFile',
	updateFn: 'uploadFile',
	deleteFn: 'deleteFile',
	readFn: 'downloadFile',
	readFnById: 'getFile',
	primaryKey: 'path',
	customizations: {
		getters: {
		},
		actions: {
		},
		mutations: {
		}
	}
});