import Field from './field.js';
import EventBus from '../../eventbus.js';

/**
 * Parameters managers
 */
var Fields = function(block, schema)
{
    // Block & meta
    this.block = block;

    // Fields
    var output = new Field(schema.returns, "Output", "output");
    this.outputs = [output];
    this.inputs = [];
    this.editables = [];
    this.indexedFields = {
        output: output
    };

    for(var name in schema.parameters) {
        var field = new Field(schema.parameters[name], name, "input");
        this.inputs.push(field);
        if (field.isEditable()) {
            this.editables.push(field);
        }
        this.indexedFields[field.name] = field;
    }
};

/**
 * Getting a field by name
 */
Fields.prototype.getField = function(name)
{
    name = name.toLowerCase();

    return (name in this.indexedFields ? this.indexedFields[name] : null);
};

/**
 * Show the settings window
 */
Fields.prototype.show = function()
{
    var title = this.block.name+' #'+this.block.id;
    var opts = {
        editables: this.editables,
        saveCallback: (data) => {
            this.save(data);
            EventBus.$emit('closeModal');
            return false;
        }
    };
    EventBus.$emit('showComponentModal', title, 'ProcessParameterEditor', opts);
};

/**
 * Saves the form
 */
Fields.prototype.save = function(serialize)
{
    var boolFields = {};
    for (var entry in this.indexedFields) {
        if (this.indexedFields[entry].type == 'boolean') {
            boolFields[entry] = this.indexedFields[entry];
        }
    }

    for (var key in serialize) {
        var newKey = key;
        var isArray = false;
        if (newKey.substr(newKey.length-2, 2) == '[]') {
            newKey = newKey.substr(0, newKey.length-2);
            isArray = true;
        }
        if (serialize[key] == null && isArray) {
            serialize[key] = [];
        }

        if (newKey in boolFields) {
            delete boolFields[newKey];
        }
        this.getField(newKey).setValue(serialize[key]);
    }

    for (var key in boolFields) {
        this.getField(key).setValue(false);
    }

    this.block.render();
    this.block.redraw();
};

export default Fields;