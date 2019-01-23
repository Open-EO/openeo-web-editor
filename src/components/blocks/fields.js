import Field from './field.js';
import EventBus from '../../eventbus.js';

/**
 * Parameters managers
 */
var Fields = function(block)
{
    var self = this;

    // Block & meta
    this.block = block;
    this.meta = this.block.meta;

    // Fields
    this.fields = [];
    for (var k in this.meta.fields) {
        var field = new Field(this.meta.fields[k]);
        this.block.blocks.types.register(field.type);
        this.fields.push(field);
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

        if ('editable' in field.attrs) {
            this.editables.push(field);
        }
        if ('input' in field.attrs) {
            this.inputs.push(field);
            field.hide = true;
        }
        if ('output' in field.attrs) {
            this.outputs.push(field);
            field.hide = true;
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
        fields: this,
        saveCallback: (element) => {
            var form = $(element);
            form.find('.pattern').remove();
            this.save(this.serializeForm(form));
            EventBus.$emit('closeModal');
            return false;
        },
        handleArrays: this.handleArrays
    };
    EventBus.$emit('showComponentModal', title, 'ProcessParameterEditor', opts);
};

Fields.prototype.serializeForm = function(form)
{
    var serialized = {};
    var formData = form.serializeArray();
    for(var i in formData) {
        var obj = formData[i];
        if (serialized[obj.name]) {
            if (Array.isArray(serialized[obj.name])) {
                serialized[obj.name].push(this.value || "");
            }
            else {
                serialized[obj.name] = [serialized[obj.name]];
            }
         }
         else {
            serialized[obj.name] = obj.value || "";
         }
    }
    return serialized;
};

/**
 * Handle Add & Remove buttons on fields array
 */
Fields.prototype.handleArrays = function(element)
{
    $(element).find('.fieldsArray').each(function() {
        var pattern = $(this).find('.pattern').html();
        var fields = $(this).find('.fields');

        var buttons = '<div class="buttons">';
        buttons += '<a class="add" href="#">Add</a> ';
        buttons += '<a class="remove" href="#">Remove</a>';
        buttons += '</div>';
        $(this).append(buttons);

        $(this).find('.add').on('click', function() {
            fields.append('<div class="field">'+pattern+'</div>');
        });

        $(this).find('.remove').on('click', function() {
            fields.find('.field').last().remove();
        });
    });
};

/**
 * Show the fields
 */
Fields.prototype.getHtml = function()
{
    var html = '';

    for (var k in this.editables) {
        html += this.editables[k].getHtml();
    }

    return html;
};

/**
 * Saves the form
 */
Fields.prototype.save = function(serialize)
{
    var boolFields = {};
    for (var entry in this.indexedFields) {
        if (this.indexedFields[entry].type == 'bool') {
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