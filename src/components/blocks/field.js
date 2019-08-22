import { ProcessSchema } from '../../processSchema.js';
import Utils from '../../utils.js';

class Field extends ProcessSchema {

    constructor(name, label, schema, description = '', isRequired = false, isOutput = false, isExperimental = false, isDeprecated = false) {
        super(schema);

        this.block = null;
        this.description = description || '';
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
        this.hasValue = false;
        if (this.hasDefaultValue()) {
            this.value = this.defaultValue();
            this.hasValue = true;
            return;
        }
        
        if (this.nullable()) {
            this.value = null;
        }
        else {
            var dataType = this.dataType(true);
            switch(dataType) {
                case 'array':
                    this.value = [];
                    break;
                case 'string':
                    this.value = '';
                    break;
                case 'integer':
                case 'number':
                    this.value = 0;
                    break;
                case 'boolean':
                    this.value = false;
                    break;
                default:
                    this.value = null;
            }
        }
    }

    setBlock(block) {
        this.block = block;
    }

    isDefaultValue() {
        return !this.hasValue || this.hasDefaultValue() && this.defaultValue() == this.getValue(); // Don't do ===, otherwise empty objects are not recognized as the same.
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
        var nativeTypes = this.dataTypes(false, true);
        // Is there any type that potentially allows multiple inputs?
        // ToDo: This is not 100% precise as raster/vector cubes for example only allow one edge to get in.
        return nativeTypes.filter(t => ['array', 'object'].includes(t)).length > 0;
    }

    _getEdgeRef(edge) {
        var otherBlock = edge.getOtherBlock(this.block);
        if (!otherBlock) {
            return null;
        }
        else if (otherBlock.isCallbackArgument()) {
            return {
                from_argument: String(otherBlock.name)
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
            this.value = ref;
            this.hasValue = true;
        }
        else if (this.isArrayType()) {
            // ToDo: Ask the user whether he wants to add an element to the array or replace it?
            if (Field.isRef(this.value)) {
                this.value = [this.value, ref];
            }
            else if (Array.isArray(this.value) && this.value.length > 0) {
                this.value.push(ref);
            }
            else {
                this.value = ref;
                this.hasValue = true;
            }
        }
        else if (this.isObjectType()) {
            if (!Field.isRef(this.value)) {
                this.value = ref; // It is not clear whether the ref should be part of the object or replace it completely
                this.hasValue = true;
            }
            else {
                var errorMsg = "Can't determine which object property this input should be assigned to. Please specify manually in Process Graph mode.";
                console.warn(errorMsg);
                this.block.blocks.showError(errorMsg);
                // ToDo: It is not quite clear what to do when multiple refs are available.
            }
        }
        else {
            // ToDo: This is probably of data type mixed or any, how to handle?
            this.value = ref;
            this.hasValue = true;
        }
    }

    _removeValueForEdge(edge) {
        var ref = this._getEdgeRef(edge);
        if (this._isRefEqual(ref, this.value)) {
            this.resetValue();
        }
        else if (this.isArrayType() || this.isObjectType()) {
            this.value = this._removeValueForEdgeDeep(this.value, ref);
        }
    }

    _removeValueForEdgeDeep(value, ref) {
        if (Array.isArray(value)) {
            var i = value.length;
            while(i--) {
                if (value[i] === null || typeof value[i] !== 'object') {
                    continue;
                }
                else if (this._isRefEqual(ref, value[i])) {
                    value.splice(i, 1);
                }
                else {
                    this._removeValueForEdgeDeep(value[i], ref);
                }
            }

        }
        else if (Utils.isObject(value)) {
            for(var key in value) {
                if (!value.hasOwnProperty(key) || value[key] === null || typeof value[key] !== 'object') {
                    continue;
                }
                else if (this._isRefEqual(ref, value[key])) {
                    delete value[key];
                }
                else {
                    this._removeValueForEdgeDeep(value[key], ref);
                }
            }
        }
        return value;
    }

    static isRef(obj) {
        return (Utils.isObject(obj) && (obj.from_argument || obj.from_node));
    }

    _isRefEqual(a, b) {
        if (!Utils.isObject(a) || !Utils.isObject(b)) {
            return false;
        }
        else if (a.from_argument && a.from_argument === b.from_argument) {
            return true;
        }
        else if (a.from_node && a.from_node == b.from_node) {
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

    setValue(value) {
        if (this.dataType(true) == 'boolean') {
            value = !!value;
        }

        this.value = value;
        this.hasValue = true;
        return this; // Allow chaining
    }

}

export default Field;