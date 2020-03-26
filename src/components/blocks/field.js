import { ProcessSchema } from '../../processSchema.js';
import Utils from '../../utils.js';

const MULTI_INPUT_TYPES = ['array', 'object', 'bounding-box', 'kernel', 'output-format-options', 'process-graph', 'process-graph-variables', 'temporal-interval', 'temporal-intervals'];

class Field extends ProcessSchema {

    constructor(name, label, schema, defaultValue = undefined, description = '', isRequired = false, isOutput = false, isExperimental = false, isDeprecated = false) {
        super(schema);

        this.block = null;
        this.description = description || '';
        this.default = defaultValue;
        this.isRequired = isRequired || false;
        this.isDeprecated = isDeprecated || false;
        this.isExperimental = isExperimental || false;
    
        // Setting attributes
        this.type = isOutput ? "output" : "input";
    
        // Field name
        this.name = name;
        this.label = label;

        // Edges
        this.edges = [];
    
        // Value
        this.resetValue();
    }

    resetValue() {
        if (typeof this.default !== 'undefined') {
            this.setValue(this.default);
            return;
        }
        
        var value;
        if (this.nullable()) {
            value = null;
        }
        else {
            var dataType = this.dataType(true);
            switch(dataType) {
                case 'array':
                    value = [];
                    break;
                case 'string':
                    value = '';
                    break;
                case 'integer':
                case 'number':
                    value = 0;
                    break;
                case 'boolean':
                    value = false;
                    break;
                default:
                    value = null;
            }
        }
        this.setValue(value, false);
    }

    setBlock(block) {
        this.block = block;
    }

    isDefaultValue() {
        return !this.hasValue || typeof this.default !== 'undefined' && this.default == this.getValue(); // Don't do ===, otherwise empty objects are not recognized as the same.
    }

    isArrayType() {
        return this.dataType(true) === 'array';
    }

    isObjectType() {
        return this.dataType(true) === 'object';
    }
    
    isEditable() {
        return this.isInput() && super.isEditable();
    }

    isOutput() {
        return this.type === 'output';
    }

    isInput() {
        return this.type === 'input';
    }

    allowsMultipleEdges() {
        // Is there any type that potentially allows multiple inputs?
        return this.dataTypes().filter(t => MULTI_INPUT_TYPES.includes(t)).length > 0;
    }

    _getEdgeRef(edge) {
        var otherBlock = edge.getOtherBlock(this.block);
        if (!otherBlock) {
            return null;
        }
        else if (otherBlock.isPgParameter()) {
            return {
                from_parameter: String(otherBlock.name)
            };
        }
        else {
            return {
                from_node: String(otherBlock.id)
            };
        }
    }

    _addValueForEdge(edge) {
        var ref = this._getEdgeRef(edge);
        if (!ref) {
            return;
        }
        else if (!this.allowsMultipleEdges()) {
            this.setValue(ref);
        }
        else if (this.isArrayType()) {
            if (Field.isRef(this.value)) {
                this.setValue([this.value, ref]);
            }
            else if (Array.isArray(this.value) && this.value.length > 0) {
                this.value.push(ref);
                this.setValue(this.value);
            }
            else {
                this.setValue(ref);
            }
        }
        else if (this.isObjectType()) {
            var hasNoKeys = (this.value && typeof this.value === 'object' && Object.keys(this.value).length === 0);
            if (this.getEdgeCount() === 1 && (!this.hasValue || hasNoKeys)) {
                this.setValue(ref);
            }
            else if (hasNoKeys) {
                this.resetValue();
            }
        }
        else {
            // ToDo: This is probably of data type mixed or any, how to handle?
            this.setValue(ref);
        }
    }

    _removeValueForEdge(edge) {
        // ToDo: Check whether this should only be executed for input fields
        var ref = this._getEdgeRef(edge);
        if (Field.isRefEqual(ref, this.value)) {
            this.resetValue();
        }
        else if (this.isArrayType() || this.isObjectType()) {
            this.setValue(this._removeValueForEdgeDeep(this.value, ref));
        }
    }

    _removeValueForEdgeDeep(value, ref) {
        if (Array.isArray(value)) {
            var i = value.length;
            while(--i >= 0) {
                if (value[i] === null || typeof value[i] !== 'object') {
                    continue;
                }
                else if (Field.isRefEqual(ref, value[i])) {
                    value.splice(i, 1);
                }
                else {
                    value[i] = this._removeValueForEdgeDeep(value[i], ref);
                }
            }

        }
        else if (Utils.isObject(value)) {
            for(var key in value) {
                if (!value.hasOwnProperty(key) || value[key] === null || typeof value[key] !== 'object') {
                    continue;
                }
                else if (Field.isRefEqual(ref, value[key])) {
                    delete value[key];
                }
                else {
                    value[i] = this._removeValueForEdgeDeep(value[key], ref);
                }
            }
        }
        return value;
    }

    static isRef(obj) {
        return (Utils.isObject(obj) && (obj.from_parameter || obj.from_node));
    }

    static isRefEqual(ref1, ref2) {
        if (!Field.isRef(ref1) || !Field.isRef(ref2)) {
            return false;
        }
        else if (ref1.from_parameter && ref1.from_parameter === ref2.from_parameter) {
            return true;
        }
        else if (ref1.from_node && ref1.from_node === ref2.from_node) {
            return true;
        }
        return false;
    }

    isLinking() {
        var link = this.block.blocks.linking;
        return (this.name === this.block.focusedField || (Array.isArray(link) && this.block.id === link[0].id && this.name === link[1]));
    }

    addEdge(edge, isDataChange = true) {
        this.edges.push(edge);
        if (isDataChange && this.isInput()) {
            this._addValueForEdge(edge);
        }
        return this; // Allow chaining
    }

    eraseEdge(edge) {
        for (var k in this.edges) {
            if (this.edges[k] == edge) {
                this._removeValueForEdge(edge);
                this.edges.splice(k, 1);
                return true;
            }
        }
        return false;
    }

    isEdgeUsed(edge) {
        var ref = this._getEdgeRef(edge);
        if (Field.isRefEqual(ref, this.value)) {
            return true;
        }
        return this._findRefInValue(ref, this.value);
    }

    _findRefInValue(ref, value) {
        if (!value || typeof value !== 'object') {
            return false;
        }
        else if (Field.isRefEqual(ref, value)) {
            return true;
        }
        for(let key in value) {
            if (this._findRefInValue(ref, value[key])) {
                return true;
            }
        }
        return false;
    }

    getRefs() {
        var obj = {
            from_node: [],
            from_parameter: []
        };
        for(var i in this.edges) {
            var ref = this._getEdgeRef(this.edges[i]);
            if (ref.from_parameter) {
                obj.from_parameter.push(ref.from_parameter);
            }
            else if (ref.from_node) {
                obj.from_node.push(ref.from_node);
            }
        }
        return obj;
    }

    getRefsInValue() {
        var obj = {
            from_node: [],
            from_parameter: []
        };
        return this._getRefsInValue(obj, ref);
    }

    _getRefsInValue(obj, value) {
        if (!value || typeof value !== 'object') {
            return false;
        }
        for(let key in value) {
            if (key === 'from_parameter' || key === 'from_node') {
                obj[key].push(value[key]);
            }
            this._getRefsInValue(obj, value[key]);
        }
        return obj;
    }

    getEdgeCount() {
        return this.edges.length;
    }

    getEdges() {
        return this.edges;
    }

    getValue() {
        return this.value;
    }

    getLabel() {
        return this.label;
    }

    setValue(value, hasValue = true) {
        if (this.dataType(true) == 'boolean') {
            value = !!value;
        }
        this.value = value;
        this.hasValue = hasValue;
        if (this.block && this.block.blocks) {
            this.block.blocks.redraw();
        }
        return this; // Allow chaining
    }

}

export default Field;