import Vue from 'vue';
import Utils from '../utils';
import { Job, Service, UserProcess } from '@openeo/js-client';
import { ProcessGraph } from '@openeo/js-processgraphs';

const serverStorage = "serverUrls";

const getDefaultState = () => {
	return {
		appMode: null,
		storedServers: JSON.parse(localStorage.getItem(serverStorage) || "[]"),
		context: null,
		process: null,
		discoverySearchTerm: '',
		hightestModalZIndex: 1000,
		epsgCodes: [],
		initialProcess: null,
		initialNode: null,
		openWizard: null,
		openWizardProps: {},
		collectionPreview: null,
		viewerOptions: {}
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
				let [id, namespace] = Utils.extractUDPParams(cx.state.initialProcess);
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
		},
		async loadForAppMode(cx) {
			if (!cx.state.appMode) {
				return;
			}

			try {
				let response = await axios(cx.state.appMode.resultUrl);
				if (Utils.isObject(response.data)) {
					cx.commit('setAppModeData', response.data);
				}
			} catch (error) {
				console.error(error);
				throw new Error("Sorry, the shared data is not available anymore!");
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
		setAppMode(state, appMode) {
			if (appMode.channels) {
				try {
					appMode.channels = appMode.channels
						.split(',')
						.map((row, i) => {
							let parts = row.split('|');
							return {
								id: parseInt(parts[0], 10),
								name: parts[1],
								min: parts[2] ? parseFloat(parts[2]) : undefined,
								max: parts[3] ? parseFloat(parts[3]) : undefined
							};
						});
				} catch (error) {
					console.error(error);
					delete appMode.channels;
				}
			}
			state.appMode = {
				...appMode,
				title: 'Results',
				data: null
			};
		},
		setAppModeData(state, data) {
			Vue.set(state.appMode, 'data', data);

			let process, title;
			if (data.type === 'Collection') {
				process = Utils.getProcessingExpression(data) || Utils.getProcessingExpression(data.summaries);
				title = data.title;
			}
			else if (data.type === 'Feature') {
				process = Utils.getProcessingExpression(data.properties) || Utils.getProcessingExpression(data); // Remove the last part, it's only there for SH right now
				title = data.properties?.title;
			}
			if (process) {
				state.process = process;
			}
			if (title) {
				Vue.set(state.appMode, 'title', title);
				state.context = title;
			}
		},
		setViewerOptions(state, options) {
			state.viewerOptions = options || {};
		},
		setOpenWizard(state, {component, options}) {
			state.openWizard = component;
			if (component) {
				state.openWizardProps = options;
			}
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
