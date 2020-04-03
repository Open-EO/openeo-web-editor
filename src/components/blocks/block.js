import Field from './field.js';
import EventBus from '@openeo/vue-components/eventbus.js';
import VueUtils from '@openeo/vue-components/utils.js';
import { JsonSchemaValidator, ProcessGraph } from '@openeo/js-processgraphs';
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

    // Hovered during edge creation?
    this.isHovered = false;

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

    // Is result node?
    this.result = false;

    // Comment for process graph node
    this.comment = null;

    // Parameters
    this.output = null;
    this.inputs = [];
    this.editables = [];
    this.fields = {};
    this._createOutputField(schema.returns);
    this._createInputFields(schema.parameters);

    this.jsonSchemaValidator = null;
};

Block.prototype._createOutputField = function(returns) {
    if (!Utils.isObject(returns)) {
        return;
    }
    this.output = new Field(
        "output",
        this.getDefaultOutputLabel(),
        returns.schema,
        undefined,
        returns.description,
        false,
        true
    );
    this.output.setBlock(this);
    this.fields.output = this.output;

};

Block.prototype._createInputFields = function(parameters) {
    if (!Array.isArray(parameters)) {
        return;
    }
    for(var p of parameters) {
        var field = new Field(p.name, p.name, p.schema, p.default, p.description, !p.optional, false, p.experimental, p.deprecated);
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
        return this.blocks.compactMode ? 110 : 200;
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
    if (this.isPgParameter()) {
        return "Process Parameter";
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

Block.prototype.isPgParameter = function() {
    return this.type === 'pg-parameter';
};

Block.prototype.getCollectionName = function() {
    return this.getField('id').getValue();
};

Block.prototype.setComment = function(comment) {
    if (typeof comment === 'string') {
        this.comment = comment;
    }
    else {
        this.comment = null;
    }
    this.render();
};

Block.prototype.getComment = function() {
    var comment = this.div.querySelector('.editComment');
    if (comment && typeof comment.value === 'string' && comment.value.length > 0) {
        this.comment = comment.value;
    }
    else {
        this.comment = null;
    }
    return this.comment;
};

Block.prototype.formatProcess = function(pg) {
    if (pg.getNodeCount() === 1) {
        return VueUtils.htmlentities(pg.getResultNode().process_id);
    }
    else {
        return 'Process';
    }
};

Block.prototype.formatValue = function(value, maxLength, html = true) {
    var formattedValue = null;
    if (typeof value === 'object') {
        if (value === null) {
            formattedValue = 'N/A';
        }
        else if (Array.isArray(value)) {
            formattedValue = this.formatArray(value, maxLength, html);
        }
        else {
            formattedValue = this.formatObject(value, html);
        }
    }
    else if (typeof value === 'string') {
        if (value.length > maxLength) {
            var text = VueUtils.htmlentities(value.substr(0, maxLength)) + '…';
            formattedValue = html ? '<span title="' + VueUtils.htmlentities(value) + '">' + text + '…</span>' : text;
        }
        else {
            formattedValue = VueUtils.htmlentities(value);
        }
    }
    else if (typeof value === 'boolean') {
        formattedValue = value ? '✔️' : '❌';
    }
    else if (typeof value === 'number') {
        formattedValue = value.toString();
    }
    else {
        formattedValue = VueUtils.htmlentities(JSON.stringify(value));
    }
    return formattedValue;
};

Block.prototype.formatArray = function(value, maxLength, html = true) {
    var formatted = value.map(v => this.formatValue(v, 25, false)).join(", ");
    // ToDo: htmlentities_decode is only available in a more recent version, remove condition once dependency has been updated.
    var unformatted = formatted;
    if (typeof VueUtils.htmlentities_decode === 'function') {
        unformatted = VueUtils.htmlentities_decode(formatted);
    }
    if (unformatted.length > 0 && unformatted.length <= maxLength) {
        return "[" + formatted + "]";
    }
    else {
        var text = 'List(' + value.length + ')';
        return html ? '<span title="' + formatted + '">' + text + '</span>' : text;
    }
};

Block.prototype.formatObject = function(value, html = true) {
    if (Object.keys(value).length === 0) {
        return 'None';
    }
    else if (value instanceof ProcessGraph) {
        return this.formatProcess(value);
    }
    else if (Field.isRef(value)) {
        if (value.from_node) {
            return "#" + VueUtils.htmlentities(value.from_node);
        }
        else {
            return "$" + VueUtils.htmlentities(value.from_parameter);
        }
    }
    else if (typeof value.west !== 'undefined' && typeof value.east !== 'undefined' && typeof value.south !== 'undefined' && typeof value.north !== 'undefined') {
        return 'Bounding Box';
    }

    try {
        if (this.jsonSchemaValidator === null) {
            this.jsonSchemaValidator = new JsonSchemaValidator();
        }
        this.jsonSchemaValidator.validateGeoJsonSimple(value);
        return value.type;
    } catch (e) {}

    // Fallback to default
    return html ? '<span title="' + VueUtils.htmlentities(JSON.stringify(value)) + '">Object</span>' : 'Object';
};

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
    if (!this.isPgParameter()) {
        header += ' <span class="blockId">#' + this.id + '</span>';
        title += ' #' + this.id;
    }

    var html = '<div class="blockTitle"><span class="titleText" title="'+title+'">'+header+'</span>';
    html += '<div class="blockicon">';
    if (!this.blocks.compactMode) {
        if (this.blocks.editable) {
            if (this.comment === null) {
                html += '<span class="addComment" title="Add comment"><i class="fas fa-comment-medical"></i></span>'
            }
            if (!this.isPgParameter()) {
                html += '<span class="delete" title="Remove (DEL)"><i class="fas fa-trash"></i></span>';
            }
        }
        html += '<span class="info" title="Details"><i class="fas fa-info"></i></span>';
    }
    if (this.canChangeParameters()) {
        html += '<span class="settings" title="Change parameter values"><i class="fas fa-sliders-h"></i></span>';
    }
    html += '</div></div>';
    html += '<div class="inout">';

    // Handling inputs & outputs
    var handle = (key, fields) => {
        html += '<div class="' + key + 's">';

        for (var k in fields) {
            var field = fields[k];

            var maxLength = 25 - field.getLabel().length;
            var formattedValue = null;
            var value = field.getValue();
            if (field && field.isEditable() && !this.blocks.compactMode && !Field.isRef(value)) {
                formattedValue = this.formatValue(value, maxLength, true);
            }

            if (typeof formattedValue === 'string') {
                if (formattedValue.length > 0) {
                    formattedValue = ': ' + formattedValue;
                }
                else {
                    formattedValue = ': <em>Empty</em>';
                }
            }
            else {
                formattedValue = '';
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

    if (!this.blocks.compactMode && this.comment !== null) {
        html += '<textarea class="editComment" placeholder="Type comment here...">' + VueUtils.htmlentities(this.comment) + '</textarea>';
    }

    return html;
};

/**
 * Render the block
 */
Block.prototype.render = function()
{
    if (!this.div) {
        return;
    }
    this.lastScale = null;
    this.isHovered = false;
    this.div.innerHTML = this.getHtml();
    this.initListeners();
    this.redraw(this.blocks.selectedBlock === this);
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
    else if (this.isPgParameter()) {
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
        if (field.isLinking()) {
            connector.classList.add('io_selected');
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
    this.div.addEventListener('mouseover', () => this.isHovered = true);
    this.div.addEventListener('mouseout', () => this.isHovered = false);

    var connectors = this.div.querySelectorAll('.connector');
    for(let connector of connectors) {
        let fieldName = connector.getAttribute('rel');

        // Allow clicking on the field name to open the editor
        let field = this.getField(fieldName);
        if (field && field.isInput() && this.canChangeParameters()) {
            connector.addEventListener('dblclick', () => this.blocks.showParameters(this, fieldName));
        }

        // Draw a link
        let circles = connector.getElementsByClassName('circle');
        let circle = circles.length > 0 ? connector.getElementsByClassName('circle')[0] : null;
        if (!circle) {
            continue;
        }

        if (this.blocks.editable) {
            circle.addEventListener('mousedown', event => {
                if (event.which == 1) {
                    this.blocks.beginLink(this, fieldName);
                    event.preventDefault();
                    event.stopPropagation();
                }
            });

            // Allow specifying the result node
            circle.addEventListener('click', event => {
                if (event.which == 1) {
                    if (this.hasOutputEdges()) {
                        this.blocks.showError("A result node can't have outgoing edges.");
                        return;
                    }
                    this.blocks.setResultNode(this);
                }
            });
        }

        // Handle focus on the I/Os
        circle.addEventListener('mouseover', () => {
            if (this.blocks.linking) {
                this.focusedField = fieldName;
            }
        });
        circle.addEventListener('mouseout', () => this.focusedField = null);
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

    // Handle the add comment icon
    var commentEl = this.div.querySelector('.addComment');
    if (commentEl) {
        commentEl.addEventListener('click', evt => {
            this.blocks.selectedBlock = this;
            this.setComment("");
            this.div.querySelector('.editComment').focus();
            evt.preventDefault();
            evt.stopPropagation();
        });
    }

    // Update the comment (box)
    var editCommentEl = this.div.querySelector('.editComment');
    if (editCommentEl) {
        editCommentEl.addEventListener('blur', evt => {
            if (typeof evt.target.value !== 'string' || evt.target.value.length === 0) {
                this.setComment(null);
            }
        });
        editCommentEl.addEventListener('change', evt => {
            if (typeof evt.target.value === 'string' && evt.target.value.length > 0) {
                this.setComment(evt.target.value);
            }
            else {
                this.setComment(null);
            }
        });
    }

    // Show the description
    var infoEl = this.div.querySelector('.info');
    if (infoEl) {
        infoEl.addEventListener('click', evt => {
            if (this.isPgParameter()) {
                this.blocks.showSchema(this.name, this.meta.returns.schema);
            }
            else if(this.isCollection()) {
                EventBus.$emit('showCollectionInfo', this.getCollectionName());
            }
            else {
                EventBus.$emit('showProcessInfoById', this.name);
            }
            evt.preventDefault();
            evt.stopPropagation();
        });
    }
};

Block.prototype.canChangeParameters = function() {
    return (this.blocks.canShowParameters() && this.editables.length > 0 && !this.isPgParameter());
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
        values: values,
        result: this.result,
        comment: this.getComment()
    };
};

Block.prototype.exportCustomProcess = function()
{
    if (this.isPgParameter()) {
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
    if (typeof this.comment === 'string' && this.comment.length > 0) {
        json.description = this.getComment();
    }
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
        let field = this.getField(newKey);
        field.setValue(serialize[key]);
    }

    for (var key in boolFields) {
        this.getField(key).setValue(false);
    }

    this.render();
    this.blocks.redraw();
};

export default Block;
