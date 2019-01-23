import Fields from './fields.js';
import Connector from './connector.js';
import EventBus from '../../eventbus.js';

/**
 * Creates an instance of a block
 */
var Block = function(blocks, meta, id)
{
    this.blocks = blocks;
    this.meta = meta;

    // Appareance values
    this.defaultFont = 10;

    // History saved before move
    this.historySaved = false;

    // Id
    this.id = id;

    // Do I have focus ?
    this.hasFocus = false;

    // Division (object)
    this.div = null;

    // Is the user dragging ?
    this.drag = null;

    // Last scale
    this.lastScale = null;

    // Parameters
    this.fields = new Fields(this);

    // Position
    this.x = 0;
    this.y = 0;

    // I/Os cardinality
    this.ios = {};

    // Which IO has focus ?
    this.focusedConnector = null;

    // Edges
    this.edges = {};

    // Connectors
    this.connectors = [];
};

Block.prototype.getWidth = function() {
    if (this.hasInputs()) {
        return this.blocks.compactMode ? 120 : 170;
    }
    else {
        return this.blocks.compactMode ? 90 : 120;
    }
};

Block.prototype.hasInputs = function() {
    return this.fields.fields.length > 1;
};

/**
 * Update the block values
 */
Block.prototype.updateValues = function()
{
    this.blocks.history.save();
};

/**
 * Set the values
 */
Block.prototype.setValues = function(values)
{
    for (var field in values) {
        this.fields.getField(field).setValue(values[field]);
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
 * Html entities on a string
 */
Block.prototype.htmlentities = function(str)
{
    str = str.replace(/</, '&lt;');
    str = str.replace(/>/, '&gt;');
    return str;
}

/**
 * Set the infos of the block
 */
Block.prototype.setInfos = function(html)
{
    this.div.find('.infos').html(html);
};

/**
 * Returns the render of the block
 */
Block.prototype.getHtml = function()
{
    var self = this;
    this.connectors = [];

    // Getting the title
    var header = this.meta.name + ' <span class="blockId">#' + this.id + '</span>';
    var title = this.meta.name + ' #' + this.id;
    for (var k in this.fields.fields) {
        var field = this.fields.fields[k];
        if (field.asTitle) {
            title = field.getPrintableValue();
        }
    }

    var html = '<div class="blockTitle"><span class="titleText" title="'+title+'">'+header+'</span>';
    html += '<div class="blockicon"><span class="delete"><i class="fas fa-trash"></i></span>';
    html += '<span class="info"><i class="fas fa-info"></i></span>';
    if (this.fields.editables.length > 0) {
        html += '<span class="settings"><i class="fas fa-sliders-h"></i></span>';
    }
    html += '</div></div>';
    html += '<div class="infos"></div><div class="inout">';

    // Handling inputs & outputs
    var handle = function(key, fields) {
        html += '<div class="' + key + 's">';

        for (var k in fields) {
            var field = fields[k];

            if (field.extensible) {
                field.size = self.maxEntry(field.name);
            }

            var size = 1;
            if (field.variadic) {
                size = field.getDimension(self.fields);
            }

            for (var x=0; x<size; x++) {
                var connectorId = field.name.toLowerCase() + '_' + key;
                var label = field.getLabel().replace('#', x+1);

                var value = '';
                if (field.dynamicLabel != null) {
                    label = String(field.dynamicLabel(self, x));
                } else {
                    if (field && field.is('editable') && !self.blocks.compactMode) {
                        value = ' ('+field.getPrintableValueWithUnit(field.variadic ? x : undefined)+')';
                    }
                }

                if (field.variadic) {
                    connectorId += '_' + x;
                }

                var circleLeft = '<div class="circle"></div>', circleRight = '';
                if (key == 'output') {
                    circleRight = circleLeft, circleLeft = '';
                }

                // Generating HTML
                html += '<div class="'+key+' type_'+field.type+' connector '+connectorId+'" rel="'+connectorId+ '">' + circleLeft + self.htmlentities(label) + value + circleRight + '</div>';
                self.connectors.push(connectorId);
            }
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
    var html = '<div id="block' + this.id + '" class="block ' + this.meta['class'] + '"></div>'

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

        this.cssParameters();
        this.lastScale = this.blocks.scale
    }

    // Changing the circle rendering
    for (var k in this.connectors) {
        var connectorId = this.connectors[k];
        var connectorDiv = this.div.find('.' + connectorId);
        var connectorVisual = connectorDiv.find('.circle');

        connectorVisual.removeClass('io_active');
        connectorVisual.removeClass('io_selected');
        if (connectorId in this.edges && this.edges[connectorId].length) {
            connectorVisual.addClass('io_active');

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
 * Sets the css for the inputs
 */
Block.prototype.cssParameters = function()
{
    this.div.find('input').css('font-size', Math.round(this.blocks.scale*this.defaultFont)+'px');
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
        self.fields.toggle();
        self.cssParameters();
    });

    // Handle the deletion
    self.div.find('.delete').on('click', function() {
        self.blocks.removeBlock(self.blocks.getBlockId(self));
    });

    // Show the description
    self.div.find('.info').on('click', function() {
        var action = '';
        switch(self.meta.module) {
            case 'process':
                EventBus.$emit('showProcessInfo', self.meta.name);
                break;
            case 'collection':
                EventBus.$emit('showCollectionInfo', self.meta.name);
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
    var tab = [];
    var connectorId = connector.id();

    if (connectorId in this.edges) {
        tab = this.edges[connectorId];
    }

    var card = this.fields.getField(connector.name).card;

    if (card[1] == '*') {
        return true;
    }

    return (tab.length < card[1]);
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
        type: this.meta.name,
        module: this.meta.module,
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

    if (field.variadic) {
        return (connector.index != null) && 
            (field.getDimension(this.fields) >= connector.index);
    } else {
        return (connector.index == null);
    }
};

export default Block;
