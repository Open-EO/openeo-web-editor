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
    var output = new Field(
        "output",
        block.getDefaultOutputLabel(),
        schema.returns.schema,
        schema.returns.description,
        schema.returns.required,
        true
    );
    this.output = output;
    this.inputs = [];
    this.editables = [];
    this.fields = {
        output: output
    };

    for(var name in schema.parameters) {
        var p = schema.parameters[name];
        var field = new Field(name, name, p.schema, p.description, p.required, false, p.experimental, p.deprecated);
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
    this.block.blocks.showParameters(this);
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