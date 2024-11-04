import Utils from './utils';
import { ProcessSchema, ProcessDataType } from '@openeo/js-commons';

export default class Process {

	static isMathProcess(p, operatorMapping = {}) {
		if (!Utils.isObject(p)) {
			return false;
		}

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

	static arrayOf(datatype) {
		if (!(datatype instanceof ProcessDataType)) {
			datatype = new ProcessDataType(datatype);
		}
		if (datatype.nativeDataType() === 'array' && Utils.isObject(datatype.schema.items)) {
			let subtype = new ProcessDataType(datatype.schema.items);
			return subtype.dataType();
		}
		return undefined;
	}
}