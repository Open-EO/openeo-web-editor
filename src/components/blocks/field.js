import { ProcessSchema } from '../../processSchema.js';

class Field extends ProcessSchema {

    constructor(meta, name, isOutput = false) {
        super(meta.schema);

        this.meta = meta;
    
        // Setting attributes
        this.type = isOutput ? "output" : "input";
    
        // Field name
        this.name = name;
        this.label = name;
    
        // Value
        this.hasValue = false;
        if (this.hasDefaultValue()) {
            this.value = this.defaultValue();
            this.hasValue = true;
            return;
        }
        
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

    isRequired() {
        return this.meta.required === true;
    }

    isDefaultValue() {
        return !this.hasValue || this.hasDefaultValue() && this.defaultValue() == this.getValue(); // Don't do ===, otherwise empty objects are not recognized as the same.
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

    description() {
        return this.meta.description;
    }

    /**
     * Return the (value) HTML rendering
     */
    getValue() {
        return this.value;
    }

    /**
     * Getting the label
     */
    getLabel() {
        return this.label;
    }

    /**
     * Setting the value of the field
     */
    setValue(value) {
        if (this.dataType(true) == 'boolean') {
            value = !!value;
        }

        this.value = value;
        this.hasValue = true;
    }

}

export default Field;