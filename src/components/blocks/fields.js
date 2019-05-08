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
    var output = new Field(schema.returns, "output", true);
    this.output = output;
    this.inputs = [];
    this.editables = [];
    this.fields = {
        output: output
    };

    for(var name in schema.parameters) {
        var field = new Field(schema.parameters[name], name);
        this.inputs.push(field);
        if (field.isEditable()) {
            this.editables.push(field);
        }
        this.fields[field.name] = field;
    }
};

/**
 * Getting a field by name
 */
Fields.prototype.getField = function(name)
{
    return (name in this.fields ? this.fields[name] : null);
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
    for (var entry in this.fields) {
        if (this.fields[entry].type == 'boolean') {
            boolFields[entry] = this.fields[entry];
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