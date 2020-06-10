import Utils from '../utils';
import { Job, Service, UserProcess } from '@openeo/js-client';

const serverStorage = "serverUrls";

const getDefaultState = () => {
	return {
		storedServers: JSON.parse(localStorage.getItem(serverStorage) || "[]"),
		context: null,
		process: null,
		hightestModalZIndex: 1000,
		epsgCodes: []
	};
};

export default {
	namespaced: true,
	state: getDefaultState(),
	getters: {
		contextTitle: (state) => state.context !== null ? Utils.getResourceTitle(state.context, true) : ''
	},
	actions: {
		async loadEpsgCodes(cx) {
			if (cx.state.epsgCodes.length === 0) {
				let res = await import('../assets/epsg.json');
				cx.commit('epsgCodes', res.default);
			}
		},
	},
	mutations: {
		openModal(state) {
			state.hightestModalZIndex = state.hightestModalZIndex + 1;
		},
		closeModal(state) {
			state.hightestModalZIndex = state.hightestModalZIndex - 1;
		},
		addServer(state, url) {
			if (state.storedServers.indexOf(url) === -1) {
				state.storedServers.push(url);
			}
			localStorage.setItem(serverStorage, JSON.stringify(state.storedServers));
		},
		removeServer(state, url) {
			state.storedServers.splice(state.storedServers.indexOf(url), 1);
			localStorage.setItem(serverStorage, JSON.stringify(state.storedServers));
		},
		setContext(state, obj) {
			state.context = obj;
			if (obj instanceof Job || obj instanceof Service) {
				state.process = obj.process;
			}
			else if (obj instanceof UserProcess) {
				state.process = obj.toJSON();
			}
			else if (Utils.isObject(obj) && obj.process) {
				state.process = obj.process;
			}
			else {
				state.process = obj;
			}
		},
		setProcess(state, process) {
			state.process = process;
		},
		epsgCodes(state, epsgCodes) {
			state.epsgCodes = epsgCodes;
		},
		reset(state) {
			Object.assign(state, getDefaultState());
		}
	}
};