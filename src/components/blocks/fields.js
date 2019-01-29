import Field from './field.js';
import EventBus from '../../eventbus.js';

/**
 * Parameters managers
 */
var Fields = function(block)
{
    // Block & meta
    this.block = block;
    this.meta = this.block.meta;

    // Fields
    this.fields = [];
    for (var k in this.meta.fields) {
        this.fields.push(new Field(this.meta.fields[k]));
    }

    // Indexed fields
    this.inputs = [];
    this.outputs = [];
    this.editables = [];
    this.indexedFields = {};

    // Indexing
    for (var k in this.fields) {
        var field = this.fields[k];
        this.indexedFields[field.name] = field;

        if (field.isEditable()) {
            this.editables.push(field);
        }
        if ('input' == field.attrs) {
            this.inputs.push(field);
        }
        if ('output' == field.attrs) {
            this.outputs.push(field);
        }
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
    var title = this.block.meta.name+' #'+this.block.id;
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