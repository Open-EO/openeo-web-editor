import { JsonSchemaValidator } from '@openeo/js-processgraphs';
import { Utils as VueUtils } from '@openeo/vue-components';
import Utils from '../../utils.js';

class ProcessSchema {
	
	constructor(schema) {
		this.schemas = JsonSchemaValidator.convertSchemaToArray(schema).map(s => new ProcessDataType(s));
	}

	toJSON() {
		return this.schemas.map(s => s.toJSON());
	}

	isEditable() {
		return this.schemas.filter(s => s.isEditable() && !s.isNull()).length > 0;
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

}

class ProcessParameter extends ProcessSchema {

	constructor(parameter) {
		super(parameter.schema || {});

		Object.assign(this, parameter);
	}

}

class ProcessDataType {
	
	constructor(schema) {
		this.schema = schema;
	}

	toJSON() {
		return this.schema;
	}

	getElementSchema(key = null) {
		let element = {};
		if (this.schema.type === 'array') {
			if (Utils.isObject(this.schema.items)) {
				// Array with one schema for all items: https://json-schema.org/understanding-json-schema/reference/array.html#id5
				element = this.schema.items;
			}
			else if (Array.isArray(this.schema.items)) {
				// Tuple validation: https://json-schema.org/understanding-json-schema/reference/array.html#id6
				if (Utils.isObject(this.schema.items[key])) {
					element = this.schema.items[key];
				}
				else if (Utils.isObject(this.schema.additionalItems)) {
					element = this.schema.additionalItems;
				}
			}
		}
		else if (this.schema.type === 'object') {
			if (Utils.isObject(this.schema.properties) && Utils.isObject(this.schema.properties[key])) {
				element = this.schema.properties[key];
			}
			else if (Utils.isObject(this.schema.additionalProperties)) {
				element = this.schema.additionalProperties;
			}
			// ToDo: No support for patternProperties yet
		}

		return new ProcessSchema(element);
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
			type = this.schema.subtype || type;
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

	title() {
		if (this.schema.title) {
			return this.schema.title;
		}
		else {
			return VueUtils.prettifyString(this.dataType());
		}
	}

	description() {
		return this.schema.description || "";
	}

}

export {
	ProcessDataType,
	ProcessSchema,
	ProcessParameter
};