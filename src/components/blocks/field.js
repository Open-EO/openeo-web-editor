import { ProcessSchema } from '../../processSchema.js';

class Field extends ProcessSchema {

    constructor(meta, name, attrs) {
        super(meta.schema);

        this.meta = meta;
    
        // Setting attributes
        this.attrs = attrs;
    
        // Field name
        this.name = name.toLowerCase();
        this.label = name;
    
        // Value
        this.hasValue = false;
        if (this.hasDefaultValue()) {
            this.value = this.defaultValue();
            this.hasValue = true;
        }
        else if (this.isArray) {
            this.value = [];
        }
        else if (this.type === 'string') {
            this.value = "";
        }
        else if (this.type === 'integer' || this.type === 'number') {
            this.value = 0;
        }
        else if (this.type === 'boolean') {
            this.value = false;
        }
        else {
            this.value = null;
        }
    }

    isRequired() {
        return this.meta.required === true;
    }
    
    isEditable() {
        return this.attrs !== 'output' && super.isEditable();
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
        if (this.type == 'boolean') {
            value = !!value;
        }

        this.value = value;
        this.hasValue = true;
    }

}

export default Field;