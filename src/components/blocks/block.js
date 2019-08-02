import Field from './field.js';
import EventBus from '../../eventbus.js';
import VueUtils from '@openeo/vue-components/utils.js';
import { ProcessGraph } from '@openeo/js-commons';
import Utils from '../../utils.js';

/**
 * Creates an instance of a block
 */
var Block = function(blocks, name, type, schema, id)
{
    this.blocks = blocks;
    this.meta = schema;
    this.name = name;
    this.type = type;

    // Appareance values
    this.defaultFont = 10;

    // History saved before move
    this.historySaved = false;

    // Id
    this.id = id;

    // Do I have focus ?
    this.hasFocus = false;

    // HTML Element (object)
    this.div = null;

    // Is the user dragging ?
    this.drag = null;

    // Last scale
    this.lastScale = null;

    // Position
    this.x = 0;
    this.y = 0;

    // Which field has focus?
    this.focusedField = null;

    // Is result node?inputs
    this.result = false;

    // Parameters
    this.output = null;
    this.inputs = [];
    this.editables = [];
    this.fields = {};
    this._createOutputField(schema.returns);
    this._createInputFields(schema.parameters, schema.parameter_order);
};

Block.prototype._createOutputField = function(returns) {
    this.output = new Field(
        "output",
        this.getDefaultOutputLabel(),
        returns.schema,
        returns.description,
        returns.required,
        true
    );
    this.output.setBlock(this);
    this.fields.output = this.output;

};

Block.prototype._createInputFields = function(parameters, parameter_order) {
    var paramNames = Object.keys(parameters);
    if (!Array.isArray(parameter_order) || parameter_order.length !== paramNames.length) {
        parameter_order = paramNames;
    }
    for(var i in parameter_order) {
        var name = parameter_order[i];
        var p = parameters[name];
        var field = new Field(name, name, p.schema, p.description, p.required, false, p.experimental, p.deprecated);
        field.setBlock(this);
        this.inputs.push(field);
        if (field.isEditable()) {
            this.editables.push(field);
        }
        this.fields[field.name] = field;
    }
};

Block.prototype.setResult = function(val) {
    this.result = val;
    this.render();
}

Block.prototype.getHeight = function() {
    return 20 + this.inputs.length * 15;
};

Block.prototype.getWidth = function() {
    if (this.hasInputs()) {
        return this.blocks.compactMode ? 110 : 170;
    }
    else {
        return this.blocks.compactMode ? 60 : 110;
    }
};

Block.prototype.hasInputs = function() {
    return this.inputs.length > 0;
};

Block.prototype.hasOutputEdges = function() {
    return this.output.getEdgeCount() > 0;
};

Block.prototype.getDefaultOutputLabel = function() {
    if (this.isCallbackArgument()) {
        return "Callback Argument";
    }
    else {
        return "Output";
    }
};

/**
 * Set the values
 */
Block.prototype.setValues = function(values, json = false)
{
    for (var fieldName in values) {
        var field = this.getField(fieldName);
        if (field !== null) {
            field.setValue(json ? JSON.parse(values[fieldName]) : values[fieldName]);
        }
    }
};

/**
 * Getting a field value
 */
Block.prototype.getValue = function(name)
{
    var field = this.getField(name);
    if (field) {
        return field.getValue();
    } else {
        return null;
    }
};

Block.prototype.isCollection = function() {
    return this.name === 'load_collection';
};

Block.prototype.isCallbackArgument = function() {
    return this.type === 'callback-argument';
};

Block.prototype.getCollectionName = function() {
    return this.getField('id').getValue();
}

/**
 * Returns the render of the block
 */
Block.prototype.getHtml = function()
{
    var name = this.name;
    if (this.isCollection()) {
        // Show collection id as title
        name = this.getCollectionName();
    }

    // Getting the title
    var header = name;
    var title = name;
    if (!this.isCallbackArgument()) {
        header += ' <span class="blockId">#' + this.id + '</span>';
        title += ' #' + this.id;
    }

    var html = '<div class="blockTitle"><span class="titleText" title="'+title+'">'+header+'</span>';
    html += '<div class="blockicon">';
    if (!this.blocks.compactMode) {
        if (this.blocks.editable && !this.isCallbackArgument()) {
            html += '<span class="delete" title="Remove (DEL)"><i class="fas fa-trash"></i></span>';
        }
        html += '<span class="info" title="Details"><i class="fas fa-info"></i></span>';
    }
    if (typeof this.blocks.openParameterEditor === 'function' && this.editables.length > 0 && !this.isCallbackArgument()) {
        html += '<span class="settings" title="Change parameter values"><i class="fas fa-sliders-h"></i></span>';
    }
    html += '</div></div>';
    html += '<div class="inout">';

    // Handling inputs & outputs
    var handle = (key, fields) => {
        html += '<div class="' + key + 's">';

        for (var k in fields) {
            var field = fields[k];

            var formattedValue = '';
            if (field && field.isEditable() && !this.blocks.compactMode) {
                var value = field.getValue();
                if (typeof value === 'object') {
                    if (value === null) {
                        formattedValue = 'N/A';
                    }
                    else {
                        if (Array.isArray(value)) {
                            var title = VueUtils.htmlentities(value.map(v => typeof v === 'string' ? v : JSON.stringify(v)).join(", "));
                            formattedValue = '<span title="' + title + '">List(' + value.length + ')</span>';
                        }
                        else if (value.callback instanceof ProcessGraph) {
                            formattedValue = 'Callback';
                        }
                        else if (value.from_argument || value.from_node) {
                            formattedValue = '';
                        }
                        else {
                            formattedValue = '<span title="' + VueUtils.htmlentities(JSON.stringify(value)) + '">Object</span>';
                        }
                    }
                }
                else if (typeof value === 'string' && value.length > 10) {
                    formattedValue = '<span title="' + VueUtils.htmlentities(value) + '">' + value.substr(0,10) + '...</span>';
                }
                else if (typeof value === 'boolean') {
                    formattedValue = value ? '✔️' : '❌';
                }
                else {
                    formattedValue = value.toString();
                }
                if (formattedValue.length > 0) {
                    formattedValue = ': ' + formattedValue;
                }
            }

            var circleLeft = '<div class="circle"></div>', circleRight = '';
            if (field.isOutput()) {
                circleRight = circleLeft, circleLeft = '';
            }

            var classNames = [
                key,
                'connector',
                'field_' + field.name,
                ((field.hasValue || !field.isRequired || field.isOutput()) ? 'hasValue' : 'noValue')
            ];
            if (this.isCollection() && field.name === 'id') {
                classNames.push('hide_collection_id');
            }
            var label;
            if (field.isOutput() && this.blocks.compactMode) {
                label = '';
            }
            else if (field.isOutput() && this.result) {
                label = 'Result';
            }
            else {
                label = VueUtils.htmlentities(field.getLabel());
            }
    
            // Generating HTML
            html += '<div class="' + classNames.join(' ') + '" rel="' + field.name + '">' + circleLeft + label + formattedValue + circleRight + '</div>';
        }
        html += '</div>';
    };

    handle('input', this.inputs);
    handle('output', [this.output]);

    html += "</div>";

    return html;
};

/**
 * Render the block
 */
Block.prototype.render = function()
{
    this.lastScale = null;
    this.hasFocus = false;
    this.div.innerHTML = this.getHtml();
    this.initListeners();
    this.redraw();
};

/**
 * Creates and inject the div
 */
Block.prototype.create = function(parentDiv)
{
    this.div = document.createElement("div");
    this.div.id = 'block' + this.id;
    this.div.classList.add('block');
    if (this.isCollection()) {
        this.div.classList.add('block_collection');
    }
    else if (this.isCallbackArgument()) {
        this.div.classList.add('block_argument');
    }
    parentDiv.appendChild(this.div);

    this.render();
};

/**
 * Sets the position and the scale of the block
 */
Block.prototype.redraw = function(selected)
{
    // Setting the position
    this.div.style.marginLeft = this.blocks.center.x+this.x*this.blocks.scale+'px';
    this.div.style.marginTop = this.blocks.center.y+this.y*this.blocks.scale+'px';

    // Showing/hiding icons
    if (this.blocks.showIcons && this.blocks.scale > 0.8) {
        this.div.querySelector('.blockicon').style.display = '';
    } else {
        this.div.querySelector('.blockicon').style.display = 'none';
    }

    // Rescaling
    if (this.lastScale != this.blocks.scale) {
        this.div.style.fontSize = Math.round(this.blocks.scale*this.defaultFont)+'px';
        this.div.style.width = Math.round(this.blocks.scale*this.getWidth())+'px';
        this.lastScale = this.blocks.scale;
    }

    // Changing the circle rendering
    for (var fieldName in this.fields) {
        var field = this.fields[fieldName];
        var fieldDiv = this.div.querySelector('.field_' + fieldName);
        if (!fieldDiv) {
            continue;
        }
        var connector = fieldDiv.querySelector('.circle');

        connector.classList.remove('io_active');
        connector.classList.remove('io_selected');
        connector.classList.remove('result');
        if (!fieldDiv.classList.contains('hasValue')) {
            fieldDiv.classList.add('noValue');
        }

        if (field.getEdgeCount() > 0) {
            connector.classList.add('io_active');
            fieldDiv.classList.remove('noValue');

            var edges = field.getEdges();
            for (var n in edges) {
                if (edges[n].selected) {
                    connector.classList.add('io_selected');
                }
            }
        }
        if (field.isOutput() && this.result) {
            connector.classList.add('result');
        }
    }

    // Is selected ?
    this.div.classList.remove('block_selected');
    if (selected) {
        this.div.classList.add('block_selected');
    }
};

/**
 * Init the function listeners
 */
Block.prototype.initListeners = function()
{
    // Drag & drop the block
    this.div.querySelector('.blockTitle').addEventListener('mousedown', event => {
        if (event.which == 1) {
            this.historySaved = false;
            this.drag = [this.blocks.mouseX/this.blocks.scale-this.x, this.blocks.mouseY/this.blocks.scale-this.y];
        }
    });
    
    var html = document.querySelector('html');
    // Dragging
    html.addEventListener('mousemove', () => {
        if (this.drag) {
            if (!this.historySaved) {
                this.blocks.history.save();
                this.historySaved = true;
            }
            this.x = (this.blocks.mouseX/this.blocks.scale-this.drag[0]);
            this.y = (this.blocks.mouseY/this.blocks.scale-this.drag[1]);
            this.blocks.redraw();
        }
    });

    // Drag the block
    html.addEventListener('mouseup', () => this.drag = null);

    // Handle focus
    this.div.addEventListener('mouseover', () => this.hasFocus = true);
    this.div.addEventListener('mouseout', () => this.hasFocus = false);

    var connectors = this.div.querySelectorAll('.connector');
    for(let connector of connectors) {
        // Draw a link
        if (this.blocks.editable) {
            connector.addEventListener('mousedown', event => {
                if (event.which == 1) {
                    this.blocks.beginLink(this, connector.getAttribute('rel'));
                    event.preventDefault();
                    event.stopPropagation();
                }
            });

            // Allow specifying the result node
            connector.addEventListener('click', event => {
                if (event.which == 1) {
                    if (this.hasOutputEdges()) {
                        this.blocks.showError("A result node can't have outgoing edges.");
                        return;
                    }
                    this.blocks.setResultNode(this);
                    this.blocks.history.save();
                }
            });
        }

        // Handle focus on the I/Os
        connector.addEventListener('mouseover', () => this.focusedField = connector.getAttribute('rel'));
        connector.addEventListener('mouseout', () => this.focusedField = null);
    }

    // Handle the parameters
    var settingsEl = this.div.querySelector('.settings');
    if (settingsEl) {
        settingsEl.addEventListener('click', evt => {
            this.blocks.showParameters(this);
            evt.preventDefault();
            evt.stopPropagation();
        });
    }

    // Handle the deletion
    var deleteEl = this.div.querySelector('.delete');
    if (deleteEl) {
        deleteEl.addEventListener('click', evt => {
            this.blocks.removeBlock(this.id);
            evt.preventDefault();
            evt.stopPropagation();
        });
    }

    // Show the description
    var infoEl = this.div.querySelector('.info');
    if (infoEl) {
        infoEl.addEventListener('click', evt => {
            if (this.isCallbackArgument()) {
                EventBus.$emit('showSchemaModal', this.name, this.meta.returns.schema);
            }
            else if(this.isCollection()) {
                EventBus.$emit('showCollectionInfo', this.getCollectionName());
            }
            else {
                EventBus.$emit('showProcessInfo', this.name);
            }
            evt.preventDefault();
            evt.stopPropagation();
        });
    }
};

/**
 * Gets the link position for an input or output
 */
Block.prototype.linkPositionFor = function(fieldName)
{
    try {
        var div = this.div.querySelector('.field_' + fieldName + ' .circle');
        var dim = Utils.domBoundingBox(div);
        var blocksDim = Utils.domBoundingBox(this.blocks.div);
        var x = (dim.offsetLeft-blocksDim.offsetLeft)+dim.width/2;
        var y = (dim.offsetTop-blocksDim.offsetTop)+dim.height/2;
    } catch (error) {
        throw 'Unable to find link position for '+fieldName+' ('+error+')';
    }

    return {x: x, y: y};
};

/**
 * Erase the block
 */
Block.prototype.erase = function()
{
    this.div.parentNode.removeChild(this.div);
};

/**
 * Find all successors of a block, and their successors
 */
Block.prototype.allSuccessors = function()
{
    // Blocks already explored
    var explored = {};
    var exploreList = [this];
    var ids = [this.id];
    explored[this.id] = true;

    while (exploreList.length > 0) {
        var currentBlock = exploreList.pop();

        for (var key in currentBlock.edges) {
            for (var i in currentBlock.edges[key]) {
                var edge = currentBlock.edges[key][i];
                var fromTo = edge.fromTo();

                if (fromTo[0] == currentBlock) {
                    var target = fromTo[1];
                    
                    if (!(target.id in explored)) {
                        explored[target.id] = true;
                        exploreList.push(target);
                        ids.push(target.id);
                    }
                }
            }
        }
    }

    return ids;
};

/**
 * Exports the block to JSON
 */
Block.prototype.export = function()
{
    var values = {};
    for (var k in this.editables) {
        var field = this.editables[k];
        values[field.name] = JSON.stringify(field.getValue());
    }

    return {
        id: this.id,
        x: this.x,
        y: this.y,
        type: this.type,
        name: this.name,
        values: values
    };
};

Block.prototype.exportProcessGraph = function()
{
    if (this.isCallbackArgument()) {
        return null;
    }

    var values = {};
    for (var k in this.inputs) {
        var field = this.inputs[k];
        if (field.hasValue) {
            if (!field.isRequired && field.isDefaultValue()) {
                continue; // Skip if it's the default value and not required
            }
            values[field.name] = field.getValue();
        }
    }

    var json = {
        process_id: this.name,
        arguments: values
    };

    if (this.result) {
        json.result = true;
    }

    return json;
};

/**
 * Getting a field by name
 */
Block.prototype.getField = function(name)
{
    return (name in this.fields ? this.fields[name] : null);
};

/**
 * Saves the form
 */
Block.prototype.save = function(serialize)
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

    this.render();
};

export default Block;
