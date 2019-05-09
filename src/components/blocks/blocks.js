import History from './history.js';
import Block from './block.js';
import Edge from './edge.js';
import SVG from './svg.js';
import Field from './field.js';
import Utils from '../../utils.js';
import { JsonSchemaValidator, ProcessGraph, Utils as CommonUtils } from '@openeo/js-commons';

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
    this.innerDiv = null;

    // SVG drawings
    this.svg = null;

    // Blocks types
    this.moduleTypes = {};

    // Instances
    this.blocks = {};

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
        this.blocks = {};
        this.id = 1;
        this.edgeId = 1;
        this.innerDiv.innerHTML = '';
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
    if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading"){
        this._run(selector);
    }
    else {
        document.addEventListener('DOMContentLoaded', () => this._run(selector));
    }
};

Blocks.prototype._run = function(selector) {
    this.div = document.querySelector(selector);

    if (!this.div) {
        alert('blocks.js: Unable to find ' + selector);
    }

    // Inject the initial editor
    this.div.innerHTML = '<div class="blocks_js_editor">'
                        + '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" class="canvas"></svg>'
                        + '<div class="blocks"></div>'
                        + '</div>';

    this.innerDiv = this.div.querySelector(".blocks");

    this.svg = new SVG(this.div.querySelector("svg"), "100%", "100%");

    // Setting up default viewer center
    var rect = Utils.domBoundingBox(this.div);
    this.center.x = rect.width/2;
    this.center.y = rect.height/2;

    // Listen for mouse position
    this.div.addEventListener('mousemove', event => {
        var rect = Utils.domBoundingBox(this.div);
        this.mouseX = event.pageX - rect.offsetLeft;
        this.mouseY = event.pageY - rect.offsetTop;
        this.move();
    });

    document.querySelector('html').addEventListener('mouseup', event => {
        if (this.linking && event.which == 1) {
            this.tryEndLink();
            this.linking = null;
            this.redraw();
        }
        if (this.moving && (event.which == 2 || event.which == 1)) {
            this.moving = null;
        }
    });

    // Detect clicks on the canvas
    this.div.addEventListener('mousedown', event => {
        if (this.canvasClicked()) {
            event.preventDefault();
        }
        
        if (event.which == 2 || (!this.selectedLink && !this.selectedBlock && event.which == 1)) {
            this.moving = [this.mouseX, this.mouseY];
        }
    });

    // Detecting key press
    document.addEventListener('keydown', e => {
        var allInputs = document.querySelectorAll('input, textarea, button, select, datalist');
        for(let el of allInputs) {
            if (el === document.activeElement) {
                return;
            }
        }

        // "del" will delete a selected link
        if (e.keyCode == 46) {
            this.deleteEvent();
        }
    });

    // Binding the mouse wheel
    this.div.addEventListener('mousewheel', event => {
        var dX = this.mouseX - this.center.x;
        var dY = this.mouseY - this.center.y;
        var deltaScale = Math.pow(1.1, event.deltaY / 40 * -1);
        this.center.x -= dX*(deltaScale-1);
        this.center.y -= dY*(deltaScale-1);
        this.scale *= deltaScale;
        this.redraw();
        event.preventDefault();
    });

    this.history = new History(this);

    if (!this.isReady) {
        this.postReady();
    }
}

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

Blocks.prototype.setResultNode = function(block, result = true) {
    if (block.result === result) {
        return; // Nothing to change
    }

    block.setResult(result);
    var foundNewResultNode = false;
    for(var i in this.blocks) {
        var other = this.blocks[i];
        if (other !== block) {
            // If we set a new result node, ensure that only that node is a result node and no other.
            if (result) {
                other.setResult(false);
            }
            // Find a potential result node if we don't want this to be the result node
            else {
                if (!other.hasOutputEdges()) {
                    other.setResult(true);
                    foundNewResultNode = true;
                    break;
                }
            }
        }
    }
    // If we have no new potential result node, communicate to the user.
    if (!result && !foundNewResultNode) {
        this.showError("No result node available, please specify one.");
    }
    this.redraw();
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
    if (this.getBlockCount() === 0) {
        block.result = true;
    }
    block.create(this.innerDiv);
    this.history.save();
    this.blocks[this.id] = block;
    this.id++;
    return block;
};

Blocks.prototype.unregisterCollections = function() {
    this.moduleTypes['collection'] = {};
};

Blocks.prototype.unregisterProcesses = function() {
    this.moduleTypes['process'] = {};
}

/**
 * Registers a new block type
 */
Blocks.prototype.registerProcess = function(meta)
{
    this.register(meta, 'process');
};

Blocks.prototype.registerCollection = function(meta)
{
    var data = CommonUtils.mergeDeep({}, meta);
    data.returns = {
        name: "output",
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
Blocks.prototype.beginLink = function(block, fieldName)
{
    this.linking = [block, fieldName];
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
                this.linking = [edge.block1, edge.field1.name];
            } else {
                this.linking = [edge.block2, edge.field2.name];
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
        if (this.blocks[k].hasFocus) {
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
    delete this.blocks[key];
    this.redraw();
};

/**
 * Retreive a block by ID
 */
Blocks.prototype.getBlockById = function(blockId)
{
    if (this.blocks[blockId]) {
        return this.blocks[blockId];
    }

    return null;
};

Blocks.prototype.getBlockCount = function() {
    return Utils.size(this.blocks);
}

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
    this.svg.clear();

    for (var k in this.edges) {
        this.edges[k].draw(this.svg);
    }

    if (this.linking) {
        try {
            var position = this.linking[0].linkPositionFor(this.linking[1]);

            this.svg.line(position.x, position.y, this.mouseX, this.mouseY, {
                'stroke': 'rgba(0,0,0,0.4)',
                'stroke-width': 3*this.scale
            });
        } catch (error) {
            console.log(error);
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
    if (!this.redrawTimeout) {
        this.redrawTimeout = setTimeout(() => this.doRedraw(), 25);
    }
};

/**
 * Tries to end a link
 */
Blocks.prototype.tryEndLink = function()
{
    for (var k in this.blocks) {
        var block = this.blocks[k];
        if (block.hasFocus && block.focusedField) {
            this.endLink(block, block.focusedField);
            break;
        }
    }
};

Blocks.prototype.addEdge = function(blockOut, fieldOut, blockIn, fieldIn) {
    if (!(blockOut instanceof Block)) {
        blockOut = this.getBlockById(blockOut);
    }
    if (!(blockIn instanceof Block)) {
        blockIn = this.getBlockById(blockIn);
    }

    var id = this.edgeId++;

    if (!(fieldOut instanceof Field)) {
        fieldOut = blockOut.getField(fieldOut);
    }
    if (!(fieldIn instanceof Field)) {
        fieldIn = blockIn.getField(fieldIn);
    }

    if (fieldOut.isOutput()) {
        var edge = new Edge(id, blockOut, fieldOut, blockIn, fieldIn, this);
    } else {
        var edge = new Edge(id, blockIn, fieldIn, blockOut, fieldOut, this);
    }

    // Check for loops or whether you want to connext the same fields
    var fromTo = edge.fromTo();
    if (fromTo[0] === fromTo[1]) {
        return;
    }
    else if (fromTo[1].allSuccessors().indexOf(fromTo[0].id) != -1) {
        throw 'You can not create a loop';
    }

    // Update result node
    this.setResultNode(fieldOut.isOutput() ? blockOut : blockIn, false);

    // Check type compatibility
    if (!this.areTypesCompatible(edge.field1, edge.field2)) {
        throw 'Types are not compatible';
    }

    // Check whether the edge exists
    for (var k in this.edges) {
        var other = this.edges[k];
        if (other.same(edge)) {
            throw 'This edge already exists';
        }
    }

    this.history.save();
    edge.create();
    this.edges.push(edge);
    this.redraw();
}

/**
 * End drawing an edge
 */
Blocks.prototype.endLink = function(block, fieldName)
{
    try {
        this.addEdge(this.linking[0], this.linking[1], block, fieldName);
    } catch (error) {
        this.showError(error);
    }

    this.linking = null;
    this.selectedBlock = null;
};

Blocks.prototype.areTypesCompatible = function(t1, t2) {
    return JsonSchemaValidator.isSchemaCompatible(t1.schema, t2.schema);
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
        edges[k] = this.edges[k].export();
    }

    return {
        edges: edges,
        blocks: blocks
    };
};


Blocks.prototype.exportProcessGraph = function() {
    if (this.getBlockCount() === 0) {
        return null;
    }    

    var nodes = {};
    for(var blockId in this.blocks) {
        nodes[blockId] = this.blocks[blockId].exportProcessGraph();
    }
    
    return nodes;
};

Blocks.prototype.importProcessGraph = function(processGraph) {
    // Parse process graph
    var pg = new ProcessGraph(processGraph);
    pg.parse();

    // Import nodes
    this.importNodesFromProcessGraph(pg.getStartNodes());

    // Import edges
    var nodes = pg.getNodes();
    for(let i in nodes) {
        var node = nodes[i];

        var args = node.getArgumentNames();
        for(let i in args) {
            if (node.getArgumentType(args[i]) == 'result') {
                var referencedNode = pg.getNode(node.getRawArgumentValue(args[i])); // get the node that is referenced in the argument
                this.addEdge(referencedNode.blockId, "output", node.blockId, args[i]);
            }
        }
    }
},

Blocks.prototype.importNodesFromProcessGraph = function(nodes, x = 0, y = 0) {
    for(let i in nodes) {
        var node = nodes[i];
        if (node.blockId > 0) {
            continue; // Node has already been added
        }

        var block = null;
        // Image Collection
        if (node.process_id === 'load_collection' && node.hasArgument("id")) {
            block = this.addCollection(node.getArgument("id"), x, y);
        }
        // Process
        else {
            block = this.addProcess(node.process_id, x, y);
            if (block) {
                block.setValues(node.arguments);
                block.render();
            }
        }
        block.result = node.isResultNode;
        node.blockId = block.id;

        this.importNodesFromProcessGraph(node.getNextNodes(), x + block.getWidth() + 20, y, block);
        y += block.getHeight() + 20;
    }
};

/**
 * Import some data
 */
Blocks.prototype.import = function(scene)
{
    this.clear();
    this.ready(() => {
        try {
            var errors = [];
            this.id = 1;
            this.edgeId = 1;

            if (typeof scene != 'object' || (scene instanceof Array)) {
                throw 'Scene is not an object';
            }
            if (!('blocks' in scene) || !(scene.blocks instanceof Array)) {
                throw 'Scene has no blocks section';
            }
            if (!('edges' in scene) || !(scene.edges instanceof Object)) {
                throw 'Scene has no edges section';
            }

            for (var k in scene.blocks) {
                var data = scene.blocks[k];
                if (data.type in this.moduleTypes && data.name in this.moduleTypes[data.type]) {
                    var block = new Block(this, data.type, this.moduleTypes[data.type][data.name], data.id);
                    block.x = data.x;
                    block.y = data.y;
                    block.setValues(data.values);
                    this.id = Math.max(this.id, block.id+1);
                    block.create(this.innerDiv);
                    this.blocks[this.id] = block;
                }
                else {
                    errors.push('Block #'+k+ ': Unable to create a block of type ' + data.type);
                }
            }

            for (var k in scene.edges) {
                var data = scene.edges[k];
                if (!'id' in data) {
                    errors.push('Edge #'+k+ ': The edge does not have an id');
                    continue;
                }
            
                var block1 = this.getBlockById(data.block1);
                var block2 = this.getBlockById(data.block2);
            
                if (!block1 || !block2) {
                    errors.push('Edge #'+k+ ': Corresponsing block does not exist');
                }
            
                var edge = new Edge(data.id, block1, block1.getField(data.field1), block2, block2.getField(data.field2), this);

                this.edgeId = Math.max(this.edgeId, edge.id+1);

                edge.create();
                this.edges.push(edge);
            }

            if (errors.length) {
                for (var k in errors) {
                    this.showError(errors[k], 'Import failed');
                }
            }

            this.redraw();
        } catch (error) {
            this.showError(error, 'Import failed');
        }
    });
};

/**
 * Go to the perfect scale
 */
Blocks.prototype.perfectScale = function()
{
    if (!this.div || this.getBlockCount() === 0) {
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

    var rect = this.div.getBoundingClientRect();

    var scaleA = rect.width/(xMax-xMin);
    var scaleB = rect.height/(yMax-yMin);
    var scale = Math.min(scaleA, scaleB);

    this.scale = scale;
    this.center.x = rect.width/2 - scale*(xMin+xMax)/2.0;
    this.center.y = rect.height/2 - scale*(yMin+yMax)/2.0;

    this.redraw();
}

export default Blocks;