import Fields from './fields.js';
import Connector from './connector.js';
import EventBus from '../../eventbus.js';
import VueUtils from '@openeo/vue-components/utils.js';

/**
 * Creates an instance of a block
 */
var Block = function(blocks, type, schema, id)
{
    this.blocks = blocks;
    this.name = schema.id;
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

    // Parameters
    this.fields = new Fields(this, schema);

    // Position
    this.x = 0;
    this.y = 0;

    // Which IO has focus ?
    this.focusedConnector = null;

    // Edges
    this.edges = {};

    // Connectors
    this.connectors = [];
};

Block.prototype.getWidth = function() {
    if (this.hasInputs()) {
        return this.blocks.compactMode ? 110 : 170;
    }
    else {
        return this.blocks.compactMode ? 70 : 120;
    }
};

Block.prototype.hasInputs = function() {
    return this.fields.inputs.length > 0;
};

/**
 * Set the values
 */
Block.prototype.setValues = function(values)
{
    for (var fieldName in values) {
        var field = this.fields.getField(fieldName);
        if (field !== null) {
            field.setValue(values[fieldName]);
        }
    }
};

/**
 * Getting the values
 */
Block.prototype.getValues = function(values)
{
    var values = {};
    for (var k in this.fields.editables) {
        var field = this.fields.editables[k];
        values[field.name] = field.getValue();
    }

    return values;
};

/**
 * Getting a field value
 */
Block.prototype.getValue = function(name)
{
    var field = this.fields.getField(name);

    if (field) {
        return field.getValue();
    } else {
        return null;
    }
};

/**
 * Returns the render of the block
 */
Block.prototype.getHtml = function()
{
    this.connectors = [];

    // Getting the title
    var header = this.name + ' <span class="blockId">#' + this.id + '</span>';
    var title = this.name + ' #' + this.id;

    var html = '<div class="blockTitle"><span class="titleText" title="'+title+'">'+header+'</span>';
    html += '<div class="blockicon">';
    if (!this.blocks.compactMode) {
        html += '<span class="delete" title="Remove (DEL)"><i class="fas fa-trash"></i></span>';
        html += '<span class="info" title="Details"><i class="fas fa-info"></i></span>';
    }
    if (this.fields.editables.length > 0) {
        html += '<span class="settings" title="Change parameter values"><i class="fas fa-sliders-h"></i></span>';
    }
    html += '</div></div>';
    html += '<div class="inout">';

    // Handling inputs & outputs
    var self = this;
    var handle = function(key, fields) {
        html += '<div class="' + key + 's">';

        for (var k in fields) {
            var field = fields[k];

            var connectorId = field.name.toLowerCase() + '_' + key;

            var formattedValue = '';
            if (field && field.isEditable() && !self.blocks.compactMode) {
                var value = field.getValue();
                if (typeof value === 'object') {
                    if (value === null) {
                        formattedValue = 'N/A';
                    }
                    else {
                        if (Array.isArray(value)) {
                            formattedValue = 'List(' + value.length + ')';
                        }
                        else {
                            formattedValue = 'Object';
                        }
                        
                        formattedValue = '<span title="' + VueUtils.htmlentities(JSON.stringify(value)) + '">' + formattedValue + '</span>';
                    }
                }
                else if (typeof value === 'string' && value.length > 10) {
                    formattedValue = '<span title="' + VueUtils.htmlentities(JSON.stringify(value)) + '">' + value.substr(0,10) + '...</span>';
                }
                else if (typeof value === 'boolean') {
                    formattedValue = value ? '✔️' : '❌';
                }
                else {
                    formattedValue = value;
                }
                formattedValue = ': ' + formattedValue;
            }

            var circleLeft = '<div class="circle"></div>', circleRight = '';
            if (key == 'output') {
                circleRight = circleLeft, circleLeft = '';
            }

            var classNames = [
                key,
                'type_' + field.type,
                'connector',
                connectorId,
                ((field.hasValue || !field.isRequired() || key == 'output') ? 'hasValue' : 'noValue')
            ];
            var label;
            if (self.blocks.compactMode && key == 'output') {
                label = '';
            }
            else {
                label = VueUtils.htmlentities(field.getLabel());
            }
    
            // Generating HTML
            html += '<div class="' + classNames.join(' ') + '" rel="' + connectorId + '">' + circleLeft + label + formattedValue + circleRight + '</div>';
            self.connectors.push(connectorId);
        }
        html += '</div>';
    };

    handle('input', this.fields.inputs);
    handle('output', this.fields.outputs);

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
    this.div.html(this.getHtml());
    this.initListeners();
    this.redraw();
};

/**
 * Returns the maximum index of entry for input field name
 */
Block.prototype.maxEntry = function(name)
{
    var max = 0;

    for (var connectorId in this.edges) {
        if (this.edges[connectorId].length) {
            var connector = new Connector(connectorId);
            if (connector.name == name) {
                max = Math.max(parseInt(connector.index)+1, max);
            }
        }
    }

    return max;
};

/**
 * Creates and inject the div
 */
Block.prototype.create = function(div)
{
    var html = '<div id="block' + this.id + '" class="block"></div>'

    div.append(html);
    this.div = div.find('#block' + this.id);

    this.render();
};

/**
 * Sets the position and the scale of the block
 */
Block.prototype.redraw = function(selected)
{
    // Setting the position
    this.div.css('margin-left', this.blocks.center.x+this.x*this.blocks.scale+'px');
    this.div.css('margin-top', this.blocks.center.y+this.y*this.blocks.scale+'px');

    // Showing/hiding icons
    if (this.blocks.showIcons && this.blocks.scale > 0.8) {
        this.div.find('.blockicon').show();
    } else {
        this.div.find('.blockicon').hide();
    }

    // Rescaling
    if (this.lastScale != this.blocks.scale) {
        this.div.css('font-size', Math.round(this.blocks.scale*this.defaultFont)+'px');
        this.div.css('width', Math.round(this.blocks.scale*this.getWidth())+'px');

        this.lastScale = this.blocks.scale
    }

    // Changing the circle rendering
    for (var k in this.connectors) {
        var connectorId = this.connectors[k];
        var connectorDiv = this.div.find('.' + connectorId);
        var connectorVisual = connectorDiv.find('.circle');

        connectorVisual.removeClass('io_active');
        connectorVisual.removeClass('io_selected');
        if (!connectorDiv.hasClass('hasValue')) {
            connectorDiv.addClass('noValue');
        }
        if (connectorId in this.edges && this.edges[connectorId].length) {
            connectorVisual.addClass('io_active');
            connectorDiv.removeClass('noValue');

            for (var n in this.edges[connectorId]) {
                if (this.edges[connectorId][n].selected) {
                    connectorVisual.addClass('io_selected');
                }
            }
        }
    }

    // Is selected ?
    this.div.removeClass('block_selected');
    if (selected) {
        this.div.addClass('block_selected');
    }
};

/**
 * Init the function listeners
 */
Block.prototype.initListeners = function()
{
    var self = this;
    // Drag & drop the block
    self.div.find('.blockTitle').on('mousedown', function(event) {
        if (event.which == 1) {
            self.historySaved = false;
            self.drag = [self.blocks.mouseX/self.blocks.scale-self.x, self.blocks.mouseY/self.blocks.scale-self.y];
        }
    });

    // Handle focus
    self.div.hover(function() {
        self.hasFocus = true;
    }, function() {
        self.hasFocus = false;
    });

    // Handle focus on the I/Os
    self.div.find('.connector').hover(function() {
        self.focusedConnector = $(this).attr('rel');
    }, function() {
        self.focusedConnector = null;
    });
        
    // Dragging
    $('html').on('mousemove', function(evt) {
        if (self.drag) {
            if (!self.historySaved) {
                self.blocks.history.save();
                self.historySaved = true;
            }
            self.x = (self.blocks.mouseX/self.blocks.scale-self.drag[0]);
            self.y = (self.blocks.mouseY/self.blocks.scale-self.drag[1]);
            self.blocks.redraw();
        }
    });

    // Drag the block
    $('html').on('mouseup', function() {
        self.drag = null;
    });

    // Draw a link
    self.div.find('.connector').on('mousedown', function(event) {
        if (event.which == 1) {
            self.blocks.beginLink(self, $(this).attr('rel'));
            event.preventDefault();
        }
    });

    // Handle the parameters
    self.div.find('.settings').on('click', function() {
        self.fields.show();
    });

    // Handle the deletion
    self.div.find('.delete').on('click', function() {
        self.blocks.removeBlock(self.blocks.getBlockId(self));
    });

    // Show the description
    self.div.find('.info').on('click', function() {
        switch(self.type) {
            case 'process':
                EventBus.$emit('showProcessInfo', self.name);
                break;
            case 'collection':
                EventBus.$emit('showCollectionInfo', self.name);
                break;
        }
    });
};

/**
 * Gets the link position for an input or output
 */
Block.prototype.linkPositionFor = function(connector)
{
    var connectorId = connector;

    if (connector instanceof Object) {
        connectorId = connector.id();
    }

    try {
        var div = this.div.find('.' + connectorId + ' .circle')

        var x = (div.offset().left-this.blocks.div.offset().left)+div.width()/2;
        var y = (div.offset().top-this.blocks.div.offset().top)+div.height()/2;
    } catch (error) {
        throw 'Unable to find link position for '+connectorId+' ('+error+')';
    }

    return {x: x, y: y};
};

/**
 * Can the io be linked ?
 */
Block.prototype.canLink = function(connector)
{
    var tab;
    var connectorId = connector.id();

    if (connectorId in this.edges) {
        tab = this.edges[connectorId];
    }

    // ToDo: Check compatibility of nodes?

    return true;
};

/**
 * Add an edge
 */
Block.prototype.addEdge = function(connector, edge)
{
    var tab = [];
    var connectorId = connector.id();

    if (this.edges[connectorId] != undefined) {
        tab = this.edges[connectorId];
    }

    tab.push(edge);
    this.edges[connectorId] = tab;
};

/**
 * Erase an edge
 */
Block.prototype.eraseEdge = function(connector, edge)
{
    var connectorId = connector.id();

    if (this.edges[connectorId] != undefined) {
        for (var k in this.edges[connectorId]) {
            if (this.edges[connectorId][k] == edge) {
                this.edges[connectorId].splice(k, 1);
                break;
            }
        }
    }
};

/**
 * Erase the block
 */
Block.prototype.erase = function()
{
    this.div.remove();
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
    return {
        id: this.id,
        x: this.x,
        y: this.y,
        type: this.type,
        name: this.name,
        values: this.getValues()
    };
};

/**
 * Gets the field
 */
Block.prototype.getField = function(name)
{
    return this.fields.getField(name);
};

/**
 * Does the block has the given connector ?
 */
Block.prototype.hasConnector = function(connector)
{
    var field = this.getField(connector.name);

    if (!field) {
        return false;
    }

    return (connector.index == null);
};

export default Block;
