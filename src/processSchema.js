class ProcessSchema {
	
	constructor(schema) {
		this.schema = schema;
		// ToDo: schema.not and schema.allOf is not supported - see also _convertSchemaToArray in jsonschema.js of openeo-js-processgraphs.
		if (schema.oneOf || schema.anyOf) {
			this.schemas = (schema.oneOf || schema.anyOf).map(s => new ProcessSubSchema(s));
		}
		else if (Array.isArray(schema.type)) {
			this.schemas = schema.type.map(t => new ProcessSubSchema(Object.assign({}, schema, {type: t})));
		}
		else {
			this.schemas = [new ProcessSubSchema(schema)];
		}

		// ToDO: Cache data?
	}

	hasDefaultValue() {
		if (typeof this.schema.default !== 'undefined') {
			return true;
		}
		
		for(var i in this.schemas) {
			if (typeof this.schemas[i].default !== 'undefined') {
				return true;
			}
		}

		return false;
	}

	defaultValue() {
		if (typeof this.schema.default !== 'undefined') {
			return this.schema.default;
		}
		
		for(var i in this.schemas) {
			if (typeof this.schemas[i].default !== 'undefined') {
				return this.schemas[i].default;
			}
		}
	}

	isEditable() {
		return this.schemas.filter(s => s.isEditable() && !s.isNull()).length > 0;
	}

	is(type) {
		var types = this.dataTypes();
		return (types.length === 1 && types[0] === type);
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

class ProcessSubSchema {
	
	constructor(schema) {
		this.schema = schema;

		if (this.schema.type === 'array') {
			this.arrayItems = new ProcessSchema(this.schema.items || {});
		}
		else {
			this.arrayItems = null;
		}
	}

	isNull() {
		return this.schema.type === 'null';
	}

	isEditable() {
		return (this.dataType() !== 'raster-cube' && this.dataType() !== 'vector-cube');
	}

	arrayOf() {
		if (this.arrayItems === null) {
			return null;
		}
		
		return this.arrayItems.dataType();
	}

	dataType(native = false) {
		var type = this.schema.type || "any";
		if (!native) {
			type = this.schema.format || type;
		}
		return type;
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
			return this.dataType();
		}
	}

	description() {
		return this.schema.description || "";
	}

}

export {
	ProcessSchema,
	ProcessSubSchema
};