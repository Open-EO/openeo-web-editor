import Utils from '../utils';
import { Job, Service, UserProcess } from '@openeo/js-client';
import { ProcessGraph } from '@openeo/js-processgraphs';

const serverStorage = "serverUrls";

const getDefaultState = () => {
	return {
		storedServers: JSON.parse(localStorage.getItem(serverStorage) || "[]"),
		context: null,
		process: null,
		discoverySearchTerm: '',
		hightestModalZIndex: 1000,
		epsgCodes: [],
		initialProcess: null,
		initialNode: null,
		collectionPreview: null
	};
};

export default {
	namespaced: true,
	state: getDefaultState(),
	getters: {
		hasProcess: state => Utils.isObject(state.process) && Utils.size(state.process) > 0 && Utils.size(state.process.process_graph),
	},
	actions: {
		async loadEpsgCodes(cx) {
			if (cx.state.epsgCodes.length === 0) {
				let res = await import('../assets/epsg-names.json');
				cx.commit('epsgCodes', res.default);
			}
		},
		async loadInitialProcess(cx) {
			if (cx.state.process) {
				return; // Process already loaded (usually during a later login)
			}
			if (Utils.isUrl(cx.state.initialProcess)) {
				let response = await axios(cx.state.initialProcess);
				if (Utils.isObject(response.data)) {
					var pg = new ProcessGraph(response.data);
					pg.parse();
					cx.commit('setProcess', response.data);
				}
			}
			else if (typeof cx.state.initialProcess === 'string' && cx.state.initialProcess.length > 0) {
				let [id, namespace] = cx.state.initialProcess.split('@');
				try {
					await cx.dispatch('loadProcess', {id, namespace}, {root: true});
				} catch (error) {
					console.warn(error);
				}
				cx.commit('setProcess', {
					process_graph: {
						[id]: {
							process_id: id,
							namespace,
							arguments: {},
							result: true
						}
					}
				});
			}
		}
	},
	mutations: {
		setDiscoverySearchTerm(state, searchTerm) {
			state.discoverySearchTerm = typeof searchTerm === 'string' ? searchTerm : '';
		},
		setInitialProcess(state, process) {
			state.initialProcess = process;
		},
		setInitialNode(state, node) {
			state.initialNode = node;
		},
		setCollectionPreview(state, collectionID) {
			state.collectionPreview = collectionID;
			if (!state.discoverySearchTerm) {
				state.discoverySearchTerm = typeof collectionID === 'string' ? collectionID : '';
			}
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