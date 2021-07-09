import Utils from './utils.js';
import { ProcessSchema } from '@openeo/js-commons';

class Process {

	static isMathProcess(p, operatorMapping = {}) {
		// Skip processes handled by operators, if given
		let operatorProcesses = Object.values(operatorMapping);
		if (operatorProcesses.includes(p.id)) {
			return false;
		}

		// Process must return a numerical value
		if (!Utils.isObject(p.returns) || !p.returns.schema) {
			return false;
		}

		let allowedTypes = ['number', 'integer', 'any'];
		let returns = new ProcessSchema(p.returns.schema);
		if (!allowedTypes.includes(returns.nativeDataType())) {
			return false;
		}

		// Required Process parameters must accept numerical values
		if (Array.isArray(p.parameters)) {
			for(var i in p.parameters) {
				let param = p.parameters[i];
				if (param.optional) {
					continue; // Skip optional parameters
				}
				if (!param.schema) {
					return false;
				}
				let schema = new ProcessSchema(param.schema);
				if (!allowedTypes.includes(schema.nativeDataType())) {
					return false;
				}
			}
		}
		
		// ToDo: Parameters with a dash (and other operators) in them are a problem

		return true;
	}
}

export default Process;