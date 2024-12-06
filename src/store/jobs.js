import storeFactory from './storeFactory';

export default storeFactory({
	namespace: 'jobs',
	listFn: 'listJobs',
	paginateFn: 'paginateJobs',
	createFn: 'createJob',
	updateFn: 'updateJob',
	deleteFn: 'deleteJob',
	readFn: 'describeJob',
	readFnById: 'getJob',
	customizations: {
		getters: {
			supportsQueue: (state, getters, rootState, rootGetters) => rootGetters.supports('startJob'),
			supportsCancel: (state, getters, rootState, rootGetters) => rootGetters.supports('stopJob')
		},
		actions: {
			async queue(cx, {data}) {
				if (cx.getters.supportsQueue) {
					let updated = await data.startJob();
					cx.commit('upsert', updated);
					return updated;
				}
				else {
					throw new Error("Queueing a batch job is not supported by the server.");
				}
			},
			async cancel(cx, {data}) {
				if (cx.getters.supportsCancel) {
					let updated = await data.stopJob();
					cx.commit('upsert', updated);
					return updated;
				}
				else {
					throw new Error("Canceling a batch job is not supported by the server.");
				}
			}
		},
		mutations: {
		}
	}
});