import History from './history.js';
import Block from './block.js';
import Edge from './edge.js';
import Connector from './connector.js';
import Utils from '../../utils.js'

/**
 * Manage the blocks
 */
var Blocks = function(errorHandler = null)
{
    this.errorHandler = errorHandler;

    // View center & scale
    this.center = {};
    this.scale = 1.3;
    this.redrawTimeout = null;

    // History manager
    this.history = null;

    // Is the user dragging the view ?
    this.moving = null;

    // Is the system ready ?
    this.isReady = false;

    // Compact mode
    this.compactMode = false;

    // Mouse
    this.mouseX = 0;
    this.mouseY = 0;

    // Linking ?
    this.linking = null;

    // Selected items
    this.selectedLink = null;
    this.selectedSide = null;
    this.selectedBlock = null;

    // BLocks division
    this.div = null;

    // Context for drawingc
    this.context = null;

    // Blocks types
    this.moduleTypes = {};

    // Instances
    this.blocks = [];

    // Edges
    this.edges = [];

    /**
     * Next block id
     */
    this.id = 1;

    /**
     * Next edge id
     */
    this.edgeId = 1;

    /**
     * Clears blocks
     */
    this.clear = function()
    {
        this.edges = [];
        this.blocks = [];
        this.id = 1;
        this.edgeId = 1;
        this.div.find('.blocks').html('');
        this.redraw();
    }

    /**
     * Show/hide icons
     */
    this.showIcons = true;    
};

/**
 * Runs the blocks editor
 */
Blocks.prototype.run = function(selector)
{
    var self = this;

    $(document).ready(function() {
        self.div = $(selector);

        if (!self.div.length) {
            alert('blocks.js: Unable to find ' + selector);
        }

        // Inject the initial editor
        self.div.html(
              '<div class="blocks_js_editor">'
            + '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" class="canvas"></svg>'
            + '<div class="blocks"></div>'
            + '</div>'
        );

        self.div.find('svg').css('width', '100%');
        self.div.find('svg').css('height', '100%');

        self.context = self.div.find('svg');

        // Setting up default viewer center
        self.center.x = self.div.width()/2;
        self.center.y = self.div.height()/2;

        // Listen for mouse position
        self.div[0].addEventListener('mousemove', function(evt) {
            self.mouseX = evt.pageX - self.div.offset().left;
            self.mouseY = evt.pageY - self.div.offset().top;
            self.move(evt);
        });

        $('html').on('mouseup', function(event) {
            if (self.linking && event.which == 1) {
                self.tryEndLink();
                self.linking = null;
                self.redraw();
            }
            if (self.moving && (event.which == 2 || event.which == 1)) {
                self.moving = null;
            }
        });

        // Detect clicks on the canvas
        self.div.on('mousedown', function(event) {
            if (self.canvasClicked()) {
                event.preventDefault();
            } 
            
            if (event.which == 2 || (!self.selectedLink && !self.selectedBlock && event.which == 1)) {
                self.moving = [self.mouseX, self.mouseY];
            }
        });
        
        // Initializing canvas
        self.context.svg();

        // Detecting key press
        $(document).on('keydown', function(e){
            if ($('input').is(':focus')) {
                return;
            }   

            // "del" will delete a selected link
            if (e.keyCode == 46) {
                self.deleteEvent();
            }
        });

        // Binding the mouse wheel
        self.div.bind('mousewheel', function(event, delta, deltaX, deltaY) {
            var dX = self.mouseX - self.center.x;
            var dY = self.mouseY - self.center.y;
            var deltaScale = Math.pow(1.1, deltaY);
            self.center.x -= dX*(deltaScale-1);
            self.center.y -= dY*(deltaScale-1);
            self.scale *= deltaScale;
            self.redraw();
            event.preventDefault();
        });

        self.history = new History(self);

        if (!self.isReady) {
            self.postReady();
        }
    });
};

/**
 * Tell the system is ready
 */
Blocks.prototype.postReady = function()
{
    this.isReady = true;
    if (this.readyQueue != undefined) {
        for (var k in this.readyQueue) {
            this.readyQueue[k]();
        }
    }
};

/**
 * Callback when ready
 */
Blocks.prototype.ready = function(callback) 
{
    if (this.isReady) {
        callback();
    } else {
        var queue = [];
        if (this.readyQueue != undefined) {
            queue = this.readyQueue;
        }
        queue.push(callback);
        this.readyQueue = queue;
    }
};

/**
 * Gets the mouse position
 */
Blocks.prototype.getPosition = function()
{
    var position = {};
    position.x = (this.mouseX-this.center.x)/this.scale;
    position.y = (this.mouseY-this.center.y)/this.scale;

    return position;
};


Blocks.prototype.hasUndo = function()
{
    if (this.history === null) {
        return 0;
    }
    return this.history.size() > 0;
}

Blocks.prototype.undo = function()
{
    if (this.history === null) {
        return;
    }
    this.history.restoreLast();
}

/**
 * Adds a block
 */
Blocks.prototype.addCollection = function(name, x, y)
{
    return this.addBlock(name, 'collection', x, y);
};

Blocks.prototype.addProcess = function(name, x, y)
{
    return this.addBlock(name, 'process', x, y);
};

Blocks.prototype.addBlock = function(name, type, x, y)
{
    if (!(type in this.moduleTypes)) {
        throw "Invalid module type specified.";
    }
    if (!(name in this.moduleTypes[type])) {
        throw "'" + name + "' not available.";
    }
    var block = new Block(this, type, this.moduleTypes[type][name], this.id);
    block.x = x;
    block.y = y;
    block.create(this.div.find('.blocks'));
    this.history.save();
    this.blocks.push(block);
    this.id++;
    return block;
};

/**
 * Registers a new block type
 */
Blocks.prototype.registerProcess = function(meta)
{
    this.register(meta, 'process');
};
Blocks.prototype.registerCollection = function(meta)
{
    var data = Utils.mergeDeep({}, meta);
    data.returns = {
        name: "Output",
        attrs: "output",
        schema: {
            type: 'object',
            format: 'raster-cube'
        }
    };
    this.register(data, 'collection');
};
Blocks.prototype.register = function(meta, type) {
    if (!(type in this.moduleTypes)) {
        this.moduleTypes[type] = {};
    }
    this.moduleTypes[type][meta.id] = meta;
}

/**
 * Begin to draw an edge
 */
Blocks.prototype.beginLink = function(block, connectorId)
{
    this.linking = [block, connectorId];
};

/**
 * The mouse has moved
 */
Blocks.prototype.move = function()
{
    if (this.selectedSide) {
        var distance = Math.sqrt(Math.pow(this.mouseX-this.selectedSide[1],2)+Math.pow(this.mouseY-this.selectedSide[2],2));
        if (distance > 15) {
            var edge = this.edges[this.selectedLink];
            if (this.selectedSide[0] == 2) {
                this.linking = [edge.block1, edge.connector1.id()];
            } else {
                this.linking = [edge.block2, edge.connector2.id()];
            }

            this.removeEdge(this.selectedLink);
            this.selectedSide = null;
            if (this.selectedLink != null && (this.selectedLink in this.edges)) {
                this.edges[this.selectedLink].selected = false;
            }
            this.selectedLink = null;
            this.redraw();
        }
    }

    if (this.moving) {
        this.center.x += (this.mouseX-this.moving[0]);
        this.center.y += (this.mouseY-this.moving[1]);
        this.moving = [this.mouseX, this.mouseY];
        this.redraw();
    }

    if (this.linking) {
        this.redraw();
    }
};

/**
 * Clicks the canvas
 */
Blocks.prototype.canvasClicked = function()
{
    var prevent = false;
    this.selectedBlock = null;
    if (this.selectedLink != null) {
        this.edges[this.selectedLink].selected = false;
    }
    this.selectedLink = null;
    this.selectedSide = null;

    for (var k in this.blocks) {
        var block = this.blocks[k];
        if (block.hasFocus) {
            this.selectedBlock = k;
        }
    }

    if (!this.selectedBlock) {
        for (var k in this.edges) {
            var collide = this.edges[k].collide(this.mouseX, this.mouseY);
            if (collide != false) {
                if (collide < 0.2) {
                    this.selectedSide = [1, this.mouseX, this.mouseY];
                } else if (collide > 0.8) {
                    this.selectedSide = [2, this.mouseX, this.mouseY];
                }
                this.selectedLink = k;
                this.edges[k].selected = true;
                prevent = true;
                break;
            }
        }
    }
            
    this.redraw();
    return prevent;
};

/**
 * Edge to remove
 */
Blocks.prototype.removeEdge = function(edge)
{
    this.history.save();
    this.edges[edge].erase();
    this.edges.splice(edge, 1);
};

/**
 * Returns an edge id
 */
Blocks.prototype.getEdgeId = function(edge)
{
    for (var k in this.edges) {
        if (edge == this.edges[k]) {
            return k;
        }
    }

    return false;
};
    
/**
 * Remove a block
 */
Blocks.prototype.removeBlock = function(key)
{
    var block = this.blocks[key];

    var newEdges = [];
    for (var k in this.edges) {
        var edge = this.edges[k];
        if (edge.block1 == block || edge.block2 == block) {
            edge.erase();
        } else {
            newEdges.push(edge);
        }
    }
    this.edges = newEdges;

    block.erase();
    this.blocks.splice(this.selectedBlock, 1);

    this.redraw();
};

/**
 * Get a block id
 */
Blocks.prototype.getBlockId = function(block)
{
    for (var k in this.blocks) {
        if (this.blocks[k] == block) {
            return k;
        }
    }

    return null;
};

/**
 * Retreive a block by ID
 */
Blocks.prototype.getBlockById = function(blockId)
{
    for (var k in this.blocks) {
        if (this.blocks[k].id == blockId) {
            return this.blocks[k];
        }
    }

    return null;
};

Blocks.prototype.canDelete = function()
{
    return (this.selectedBlock != null || this.selectedLink != null);
}

/**
 * Delete the current link
 */
Blocks.prototype.deleteEvent = function()
{
    // Remove a block and its edges
    if (this.selectedBlock != null) {
        this.history.save();
        this.removeBlock(this.selectedBlock);
        this.selectedBlock = null;
    }

    // Remove an edge
    if (this.selectedLink != null) {
        this.history.save();
        this.removeEdge(this.selectedLink);
        this.selectedLink = null;
        this.redraw();
    }
};

/**
 * Do the redraw
 */
Blocks.prototype.doRedraw = function()
{
    // Set the position for blocks
    for (var k in this.blocks) {
        this.blocks[k].redraw(this.selectedBlock == k);
    }

    // Redraw edges
    var svg = this.context.svg('get');
    svg.clear();

    for (var k in this.edges) {
        this.edges[k].draw(svg);
    }

    if (this.linking) {
        try {
            var position = this.linking[0].linkPositionFor(this.linking[1]);

            svg.line(position.x, position.y, this.mouseX, this.mouseY, {
                stroke: 'rgba(0,0,0,0.4)',
                strokeWidth: 3*this.scale
            });
        } catch (error) {
            this.linking = null;
        }
    }
    
    this.redrawTimeout = null;
};

/**
 *  Draw the edges
 */
Blocks.prototype.redraw = function()
{
    var self = this;

    if (!this.redrawTimeout) {
        this.redrawTimeout = setTimeout(function() { self.doRedraw(); }, 25);
    }
};

/**
 * Tries to end a link
 */
Blocks.prototype.tryEndLink = function()
{
    for (var k in this.blocks) {
        var block = this.blocks[k];
        if (block.hasFocus && block.focusedConnector) {
            this.endLink(block, block.focusedConnector);
            break;
        }
    }
};

Blocks.prototype.addEdge = function(blockOut, connectorOut, blockIn, connectorIn) {
    var id = this.edgeId++;

    if (!(connectorOut instanceof Connector)) {
        connectorOut = new Connector(connectorOut, "output");
    }
    if (!(connectorIn instanceof Connector)) {
        connectorIn = new Connector(connectorIn, "input");
    }

    if (connectorOut.isOutput()) {
        var edge = new Edge(id, blockOut, connectorOut, blockIn, connectorIn, this);
    } else {
        var edge = new Edge(id, blockIn, connectorIn, blockOut, connectorOut, this);
    }

    for (var k in this.edges) {
        var other = this.edges[k];
        if (other.same(edge)) {
            throw 'This edge already exists';
        }
    }

    var fromTo = edge.fromTo();
    if (fromTo[1].allSuccessors().indexOf(fromTo[0].id) != -1) {
        throw 'You can not create a loop';
    }

    this.history.save();
    edge.create();
    var edgeIndex = this.edges.push(edge)-1;

    var types = edge.getTypes();
    if (!this.isTypeCompatible(types[0], types[1])) {
        this.removeEdge(edgeIndex);
        throw 'Types '+types[0]+' and '+types[1]+' are not compatible';
    }
    this.redraw();
}

/**
 * End drawing an edge
 */
Blocks.prototype.endLink = function(block, connectorId)
{
    try {
        this.addEdge(this.linking[0], new Connector(this.linking[1]), block, new Connector(connectorId));
    } catch (error) {
        this.showError(error);
    }
    this.linking = null;
    this.selectedBlock = null;
};

Blocks.prototype.isTypeCompatible = function(t1, t2) {
    // ToDo: The different string formats
    // ToDo: Any type
    if (t1 === t2) {
        return true;
    }
    else if ((t1 === 'number' && t2 === 'integer') || (t1 === 'integer' && t2 === 'number')) {
        return true;
    }
    return false;
}

Blocks.prototype.showError = function(message, title = null) {
    if (typeof this.errorHandler === 'function')  {
        this.errorHandler(message, title);
    }
    else {
        console.log(title, message);
    }
}

/**
 * Changing the compact mode
 */
Blocks.prototype.toggleCompact = function()
{
    this.compactMode = !this.compactMode;
    for (var k in this.blocks) {
        this.blocks[k].render();
    }
    this.redraw();
};

/**
 * Export the scene
 */
Blocks.prototype.export = function()
{
    var blocks = [];
    var edges = [];

    for (var k in this.blocks) {
        blocks.push(this.blocks[k].export());
    }

    for (var k in this.edges) {
        edges.push(this.edges[k].export());
    }

    return {
        edges: edges,
        blocks: blocks
    };
};

/**
 * Import some data
 */
Blocks.prototype.importData = function(scene)
{
    this.clear();
    this.doLoad(scene, false);
}

/**
 * Lads a scene
 */
Blocks.prototype.load = function(scene)
{
    this.doLoad(scene, true);
}

/**
 * Loads the scene
 */
Blocks.prototype.doLoad = function(scene, init)
{
    var self = this;

    this.ready(function() {
        try {
            var errors = [];
            self.id = 1;
            self.edgeId = 1;

            if (typeof scene != 'object' || (scene instanceof Array)) {
                throw 'Scene is not an object';
            }
            if (!('blocks' in scene) || !(scene.blocks instanceof Array)) {
                throw 'Scene has no blocks section';
            }
            if (!('edges' in scene) || !(scene.edges instanceof Array)) {
                throw 'Scene has no blocks section';
            }

            for (var k in scene.blocks) {
                try {
                    var data = scene.blocks[k];
                    var block = self.blockImport(data);
                    self.id = Math.max(self.id, block.id+1);
                    block.create(self.div.find('.blocks'));
                    self.blocks.push(block);
                } catch (error) {
                    errors.push('Block #'+k+ ':'+error);
                }
            }

            for (var k in scene.edges) {
                try {
                    var data = scene.edges[k];
                    var edge = self.edgeImport(data);

                    self.edgeId = Math.max(self.edgeId, edge.id+1);

                    edge.create();
                    self.edges.push(edge);
                } catch (error) {
                    errors.push('Edge #'+k+' :'+error);
                }
            }

            if (errors.length) {
                for (var k in errors) {
                    self.showError(errors[k], 'Loading error');
                }
            }

            self.redraw();

            if (init) {
                self.perfectScale();	    
            }
        } catch (error) {
            self.showError(error, 'Unable to create edge');
        }
    });
};



/**
 * Imports JSON data into an edge
 */
Blocks.prototype.edgeImport = function(data)
{
    if (!'id' in data) {
        throw "An edge does not have an id";
    }

    var block1 = this.getBlockById(data.block1);
    var block2 = this.getBlockById(data.block2);

    if (!block1 || !block2) {
	    throw "Error while importing an edge, a block did not exists";
    }

    return new Edge(data.id, block1, new Connector(data.connector1), 
                             block2, new Connector(data.connector2), this);
};

/**
 * Imports JSON data into a block
 */
Blocks.prototype.blockImport = function(data) {
    if (data.type in this.moduleTypes && data.name in this.moduleTypes[data.module]) {
        var block = new Block(this, data.type, this.moduleTypes[data.type][data.name], data.id);
        block.x = data.x;
        block.y = data.y;
        block.setValues(data.values);
        return block;
    }

    throw 'Unable to create a block of type ' + data.type;
}

/**
 * Go to the perfect scale
 */
Blocks.prototype.perfectScale = function()
{
    if (!this.div || this.blocks.length === 0) {
        return;
    }

    var xMin = null, xMax = null;
    var yMin = null, yMax = null;

    for (var k in this.blocks) {
        var block = this.blocks[k];
        if (xMin == null) {
            xMin = block.x-15
            xMax = block.x+block.getWidth()+18;
            yMin = block.y-15
            yMax = block.y+115;
        } else {
            xMin = Math.min(xMin, block.x-15);
            xMax = Math.max(xMax, block.x+block.getWidth()+18);
            yMin = Math.min(yMin, block.y-15);
            yMax = Math.max(yMax, block.y+115);
        }
    }
    var scaleA = this.div.width()/(xMax-xMin);
    var scaleB = this.div.height()/(yMax-yMin);
    var scale = Math.min(scaleA, scaleB);

    this.scale = scale;
    this.center.x = this.div.width()/2 - scale*(xMin+xMax)/2.0;
    this.center.y = this.div.height()/2 - scale*(yMin+yMax)/2.0;

    this.redraw();
}

/**
 * Write labels on the edges, edges is an object of ids => label
 */
Blocks.prototype.setLabels = function(labels)
{
    for (var k in this.edges) {
        var edge = this.edges[k];

        if (edge.id in labels) {
            edge.setLabel(labels[k]);
        }
    }
}

export default Blocks;