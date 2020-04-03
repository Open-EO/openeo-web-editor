import storeFactory from './storeFactory';

export default storeFactory({
	namespace: 'jobs',
	listFn: 'listJobs',
	createFn: 'createJob',
	updateFn: 'updateJob',
	deleteFn: 'deleteJob',
	readFn: 'describeJob',
	readFnById: 'getJob',
	customizations: {
		getters: {
		},
		actions: {
		},
		mutations: {
		}
	}
});