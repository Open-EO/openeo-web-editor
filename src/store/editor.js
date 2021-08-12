import Utils from '../utils';
import { Job, Service, UserProcess } from '@openeo/js-client';
import { ProcessGraph } from '@openeo/js-processgraphs';

const serverStorage = "serverUrls";

const getDefaultState = importFromQuery => {
	return {
		storedServers: JSON.parse(localStorage.getItem(serverStorage) || "[]"),
		context: null,
		process: null,
		discoverySearchTerm: '',
		hightestModalZIndex: 1000,
		epsgCodes: [],
		initialProcessUrl: importFromQuery ? Utils.param('process') : null
	};
};

export default {
	namespaced: true,
	state: getDefaultState(true),
	actions: {
		async loadEpsgCodes(cx) {
			if (cx.state.epsgCodes.length === 0) {
				let res = await import('../assets/epsg.json');
				cx.commit('epsgCodes', res.default);
			}
		},
		async loadInitialProcess(cx) {
			if(!Utils.isUrl(cx.state.initialProcessUrl)) {
				return;
			}
			let response = await axios(cx.state.initialProcessUrl);
			if (Utils.isObject(response.data)) {
				var pg = new ProcessGraph(response.data);
				pg.parse();
				cx.commit('setProcess', response.data);
			}
		}
	},
	mutations: {
		setDiscoverySearchTerm(state, searchTerm) {
			state.discoverySearchTerm = searchTerm;
		},
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