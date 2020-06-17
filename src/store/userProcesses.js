import storeFactory from './storeFactory';
import Utils from '../utils';
import { Process } from '../components/blocks/processSchema.js';
import Vue from 'vue';

export default storeFactory({
	namespace: 'userProcesses',
	listFn: 'listUserProcesses',
	createFn: 'setUserProcess',
	updateFn: 'replaceUserProcess',
	deleteFn: 'deleteUserProcess',
	readFn: 'describeUserProcess',
	readFnById: 'getUserProcess',
	customizations: {
		state: {
			operatorMapping: {
				"-": "subtract",
				"+": "add",
				"/": "divide",
				"*": "multiply",
				"^": "power"
			},
			arrayOperatorMapping: {
				'product': '*',
				'sum': '+'
			}
		},
		getters: {
			reverseOperatorMapping(state) {
				let mapping = {};
				for(var op in state.operatorMapping) {
					mapping[state.operatorMapping[op]] = op;
				}
				return Object.assign(mapping, state.arrayOperatorMapping);
			},
			getAllById: (state, getters, rootState) => (id) => {
				let customProcess = getters.getById(id);
				if (customProcess !== null) {
					return customProcess;
				}
				for(let process of rootState.predefinedProcesses) {
					if (process.id === id) {
						return process;
					}
				}
				return null;
			},
			supportsMath: (state, getters) => {
				for(let i in state.operatorMapping) {
					let processId = state.operatorMapping[i];
					if (!getters.getAllById(processId)) {
						return false;
					}
				}
				return true;
			},
			isMathProcess: (state, getters) => (process) => {
				if (!Utils.isObject(process) || Utils.size(process.process_graph) === 0) {
					return null;
				}
				let unsupportedFuncs = Object.values(process.process_graph).filter(node => !getters.readableMathProcesses.includes(node.process_id));
				if (unsupportedFuncs.length) {
					return false;
				}
				return true;
			},
			mathProcesses(state, getters, rootState, rootGetters) {
				return rootGetters.processRegistry.all().filter(Process.isMathProcess);
			},
			readableMathProcesses(state, getters) {
				return getters.mathProcesses.map(p => p.id)
						.concat(Object.values(state.operatorMapping))
						.concat(Object.keys(state.arrayOperatorMapping))
						.concat(['array_element']);
			}
		},
		actions: {
		},
		mutations: {
			data(state, data) {
				state.userProcesses = data
					.filter(p => (typeof p.id === 'string'))
					.sort(Utils.sortById);
	
				for(let key in state.userProcesses) {
					Vue.set(state.index, state.userProcesses[key].id, key);
				}
			}
		}
	}
});