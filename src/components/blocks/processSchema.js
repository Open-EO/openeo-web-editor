import Utils from '../../utils.js';
import { ProcessUtils } from '@openeo/js-commons';

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

class ProcessSchema {
	
	constructor(schema = null, defaultValue = undefined) {
		if (!Utils.isObject(schema) && !Array.isArray(schema)) {
			this.unspecified = true;
			this.schemas = [];
		}
		else {
			this.unspecified = false;
			this.schemas = ProcessUtils.normalizeJsonSchema(schema, true).map(s => new ProcessDataType(s, this, defaultValue));

			let defaults = this.schemas.filter(s => typeof s.default() !== 'undefined');
			if (defaults.length === 1) {
				this.default = defaults[0].default();
			}
		}

		this.refs = [];
	}

	toJSON() {
		return this.schemas.map(s => s.toJSON());
	}

	isEditable() {
		return this.unspecified || this.schemas.filter(s => s.isEditable() && !s.isNull()).length > 0;
	}

	is(type) {
		var types = this.dataTypes();
		return (types.length === 1 && types[0] === type);
	}

	nativeDataType() {
		return this.dataType(true);
	}

	dataType(native = false) {
		var types = this.dataTypes(true, native);
		var nullIndex = types.indexOf('null');
		if (types.length === 1) {
			return types[0];
		}
		else if (types.length === 2 && nullIndex != -1) {
			return types[nullIndex === 0 ? 1 : 0];
		}
		else {
			return 'mixed';
		}
	}

	dataTypes(includeNull = false, native = false) {
		var types = this.schemas.map(s => s.dataType(native));
		types = types.filter((v, i, a) => a.indexOf(v) === i); // Return each type only once
		if (!includeNull) {
			types = types.filter(s => s !== 'null');
		}
		return types;
	}

	nullable() {
		return this.schemas.filter(s => s.isNull()).length > 0;
	}

	setRefs(refs) {
		this.refs = refs;
	}

	getRefs() {
		return this.refs
	}

}

class ProcessParameter extends ProcessSchema {

	constructor(parameter) {
		super(parameter.schema, parameter.default);

		Object.assign(this, parameter);
	}

}

class ProcessDataType {
	
	constructor(schema, parent = null, defaultValue = undefined) {
		this.schema = schema;
		if (typeof this.schema.default === 'undefined' && typeof defaultValue !== 'undefined') {
			this.schema.default = defaultValue;
		}
		this.parent = parent;
	}

	toJSON() {
		return this.schema;
	}

	getElementSchema(key = null) {
		let element = ProcessUtils.getElementJsonSchema(this.schema, key);
		let schema = new ProcessSchema(element);
		if (this.parent instanceof ProcessSchema) {
			schema.setRefs(this.parent.getRefs());
		}
		return schema;
	}

	isNull() {
		return this.schema.type === 'null';
	}

	isEditable() {
		return (this.dataType() !== 'raster-cube' && this.dataType() !== 'vector-cube');
	}

	dataType(native = false) {
		var type = this.schema.type || "any";
		if (!native) {
			type = this.schema.refId || this.schema.subtype || type;
		}
		return type;
	}

	nativeDataType() {
		return this.dataType(true);
	}

	isEnum() {
		return Array.isArray(this.schema.enum);
	}

	getEnumChoices() {
		return this.schema.enum;
	}

	getCallbackParameters() {
		return this.schema.parameters;
	}

	group() {
		return this.schema.group || 'Other';
	}

	title() {
		if (this.schema.title) {
			return this.schema.title;
		}
		else {
			return Utils.prettifyString(this.dataType());
		}
	}

	description() {
		return this.schema.description || "";
	}

	default() {
		if (typeof this.schema.default === 'function') {
			return this.schema.default();
		}
		else if (typeof this.schema.default !== 'undefined') {
			return this.schema.default;
		}
		else {
			return undefined;
		}
	}

}

export {
	Process,
	ProcessDataType,
	ProcessSchema,
	ProcessParameter
};