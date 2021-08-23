import Utils from './utils';
import Process from './process';
import { Formula } from '@openeo/js-client';
import { ProcessGraph } from '@openeo/js-processgraphs';

export default {
	mathProcesses: null,
	getMathProcesses() {
		if (!this.mathProcesses) {
			this.mathProcesses = this.all().filter(Process.isMathProcess);
		}
		return this.mathProcesses;
	},
	isMath(process) {
		if (process instanceof ProcessGraph) {
			process = process.process;
		}
		if (!Utils.isObject(process) || Utils.size(process.process_graph) === 0) {
			return null;
		}

		let mathProcessIds = this.getMathProcesses().map(p => p.id)
			.concat(Object.values(Formula.operatorMapping))
			.concat(Object.keys(Formula.arrayOperatorMapping))
			.concat(['array_element']);
		let unsupportedFuncs = Object.values(process.process_graph).find(node => !mathProcessIds.includes(node.process_id));
		return (typeof unsupportedFuncs === 'undefined');
	}
};