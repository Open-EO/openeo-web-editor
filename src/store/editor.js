import Utils from '../utils';

const serverStorage = "serverUrls";

const getDefaultState = () => {
	return {
		storedServers: JSON.parse(localStorage.getItem(serverStorage) || "[]"),
		activeScript: null,
		hightestModalZIndex: 1000,
		epsgCodes: []
	};
};

export default {
	namespaced: true,
	state: getDefaultState(),
	getters: {
		scriptTitle: (state) => state.activeScript !== null ? Utils.getResourceTitle(state.activeScript, true) : ''
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
		setScript(state, obj) {
			state.activeScript = obj;
		},
		epsgCodes(state, epsgCodes) {
			state.epsgCodes = epsgCodes;
		},
		reset(state) {
			Object.assign(state, getDefaultState());
		}
	}
};