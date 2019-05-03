import Utils from './utils.js';

class ProcessSchema {
	
	constructor(schema) {
		this.schema = schema;
		// ToDo: schema.not is not supported
		if (schema.allOf) {
			// ToDo: Mergin allOF is not always correct, but should be enough in mostly all cases.
			var merged = Utils.mergeDeep({}, schema.allOf);
			this.schemas = [new ProcessSubSchema(merged)];
		}
		else if (schema.oneOf || schema.anyOf) {
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

	dataTypes(includeNull = false) {
		var types = this.schemas.map(s => s.dataType());
		if (!includeNull) {
			types = types.filter(s => !s.isNull());
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
		return this.type === 'null';
	}

	isEditable() {
		return (this.dataType() !== 'raster-cube' && this.dataType() !== 'vector-cube');
	}

	arrayOf() {
		if (this.arrayItems === null) {
			return null;
		}
		
		return this.arrayItems.dataTypes();
	}

	dataType() {
		return this.schema.format || this.schema.type || "any";
	}

	isEnum() {
		return Array.isArray(this.schema.enum);
	}

	getEnumChoices() {
		return this.schema.enum;
	}

	title() {
		var title = this.dataType();
		if (this.schema.title) {
			title += " - " + this.schema.title;
		}
		return title;
	}

}

export {
	ProcessSchema,
	ProcessSubSchema
};