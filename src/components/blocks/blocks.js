import History from './history.js';
import Block from './block.js';
import Edge from './edge.js';
import SVG from './svg.js';
import Field from './field.js';
import Utils from '../../utils.js';
import { JsonSchemaValidator, ProcessGraph } from '@openeo/js-processgraphs';

/**
 * Manage the blocks
 */
var Blocks = function(errorHandler = null, openParameterEditor = null, openSchemaModal = null)
{
    this.errorHandler = errorHandler;
    this.openParameterEditor = openParameterEditor;
    this.openSchemaModal = openSchemaModal;
    this.active = true;
    this.editable = true;

    // View center & scale
    this.center = {
        x: 0,
        y: 0
    };
    this.newBlockOffset = 0;
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

    // Collection default values
    this.collectionDefaults = {};

    // Instances
    this.blocks = {};

    // Edges
    this.edges = [];

    /**
     * Next block id
     */
    this.nextId = 1;

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
        if (this.innerDiv) {
            this.innerDiv.innerHTML = '';
            this.redraw();
        }
    }

    /**
     * Show/hide icons
     */
    this.showIcons = true;    
};

/**
 * Runs the blocks editor
 */
Blocks.prototype.run = function(selector, editable = true)
{
    this.div = document.querySelector(selector);
    this.editable = editable;

    if (!this.div) {
        console.error('blocks.js: Unable to find ' + selector);
        return;
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
        if (this.editable && this.linking && event.which == 1) {
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

        // "del" will delete a selected link or block
        if (this.editable && e.keyCode == 46 && this.active) {
            this.deleteEvent();
        }
    });

    // Binding the mouse wheel
    var mousewheelEventFn = event => {
        var dX = this.mouseX - this.center.x;
        var dY = this.mouseY - this.center.y;
        var wheelDelta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail)); // Browser compatibility, see https://embed.plnkr.co/plunk/skVoXt
        var deltaScale = Math.pow(1.1, wheelDelta);
        this.center.x -= dX*(deltaScale-1);
        this.center.y -= dY*(deltaScale-1);
        this.newBlockOffset = 0;
        this.scale *= deltaScale;
        this.redraw();
        event.preventDefault();
    };
    this.div.addEventListener('DOMMouseScroll', mousewheelEventFn); // Firefox
    this.div.addEventListener('mousewheel', mousewheelEventFn); // All other browsers

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

Blocks.prototype.canShowParameters = function() {
    return (typeof this.openParameterEditor === 'function');
};

Blocks.prototype.showParameters = function(block, field = null) {
    if (this.canShowParameters()) {
        this.openParameterEditor(this, block, this.editable, field);
    }
};

Blocks.prototype.showSchema = function(name, schema) {
    if (typeof this.openSchemaModal === 'function') {
        this.openSchemaModal(name, schema);
    }
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

    if (!this.blocks[this.selectedBlock]) {
        this.selectedBlock = null;
    }
    if (!this.edges[this.selectedLink]) {
        this.selectedLink = null;
    }
}

Blocks.prototype.setResultNode = function(block, result = true) {
    if (block.result === result) {
        return; // Nothing to change
    }

    this.history.save();
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
    if (this.getBlockCount() > 0 && !result && !foundNewResultNode) {
        this.showError("No result node available, please specify one.");
    }
    this.redraw();
}

Blocks.prototype.getPositionForPageXY = function(x, y) {
    var rect = Utils.domBoundingBox(this.div);
    if (x !== null) {
        x = (x - rect.offsetLeft - this.center.x) / this.scale;
    }
    if (y !== null) {
        y = (y - rect.offsetTop - this.center.y) / this.scale;
    }
    return {x: x, y: y};
};

/**
 * Adds a block
 */
Blocks.prototype.addCollection = function(name, x = null, y = null)
{
    var spatialExtent = null;
    var temporalExtent = null;
    if (typeof this.collectionDefaults[name] === 'object') {
        spatialExtent = this.collectionDefaults[name].spatialExtent;
        temporalExtent = this.collectionDefaults[name].temporalExtent;
    }
    return this.createBlock('load_collection', 'process', x, y, {id: name, spatial_extent: spatialExtent, temporal_extent: temporalExtent});
};

Blocks.prototype.addProcess = function(name, x = null, y = null, id = null)
{
    return this.createBlock(name, 'process', x, y, {}, id);
};

Blocks.prototype.addPgParameter = function(name, x = null, y = null)
{
    return this.createBlock(name, 'parameter', x, y);
};

Blocks.prototype.createBlock = function(name, type, x, y, values = {}, id = null)
{
    if (!(type in this.moduleTypes)) {
        throw "Invalid module type specified.";
    }
    if (!(name in this.moduleTypes[type])) {
        throw "'" + name + "' not available.";
    }
    var block = new Block(this, name, type, this.moduleTypes[type][name], id);
    var rect = Utils.domBoundingBox(this.div);
    block.x = x === null ? ((-this.center.x + rect.width/2)/this.scale - block.getWidth()/2 + this.newBlockOffset) : x;
    block.y = y === null ? ((-this.center.y + rect.height/2)/this.scale - block.getHeight()/2 + this.newBlockOffset) : y;
    if (this.newBlockOffset < 150) {
        this.newBlockOffset += 10;
    }
    if (this.getProcessBlockCount() === 0 && !block.isPgParameter()) {
        block.result = true;
    }
    block.setValues(values);
    if (!block.isPgParameter()) {
        this.history.save();
    }
    this.addBlock(block);
    return block;
};

Blocks.prototype.unregisterCollectionDefaults = function() {
    this.collectionDefaults = {};
}

Blocks.prototype.unregisterProcesses = function() {
    this.moduleTypes['process'] = {};
}

Blocks.prototype.unregisterPgParameters = function() {
    this.moduleTypes['parameters'] = [];
}

Blocks.prototype.registerCollectionDefaults = function(collection) {
    try {
        this.collectionDefaults[collection.id] = {
            spatialExtent: Utils.extentToBBox(collection.extent.spatial),
            temporalExtent: collection.extent.temporal
        };
    } catch (error) {
        console.warn(error);
    }
};

/**
 * Registers a new block type
 */
Blocks.prototype.registerProcess = function(meta)
{
    this.register(meta, 'process', meta.id);
};

Blocks.prototype.registerPgParameter = function(param)
{
    // ToDo: Check 1.0 compat
    var data = {
        description: param.description,
        parameters: [],
        returns: Object.assign({}, param, {attrs: "output"})
    };
    this.register(data, 'parameter', param.name);
};

Blocks.prototype.register = function(meta, type, name) {
    if (!(type in this.moduleTypes)) {
        this.moduleTypes[type] = {};
    }
    this.moduleTypes[type][name] = meta;
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
    if (this.editable && this.selectedSide) {
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
        this.newBlockOffset = 0;
        this.moving = [this.mouseX, this.mouseY];
        this.redraw();
    }

    if (this.editable && this.linking) {
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
        if (this.blocks[k].isHovered) {
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
    if (block.id == this.selectedBlock) {
        this.selectedBlock = null;
    }
    delete this.blocks[key];
    if (block.result) {
        this.setResultNode(block, false);
    }
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

Blocks.prototype.getPgParameterBlockByName = function(name)  {
    for(var i in this.blocks) {
        var block = this.blocks[i];
        if (block.isPgParameter() && block.name === name) {
            return block;
        }
    }
    return null;
}

Blocks.prototype.getBlockCount = function() {
    return Utils.size(this.blocks);
};

Blocks.prototype.getProcessBlockCount = function() {
    return Utils.size(Object.values(this.blocks).filter(b => !b.isPgParameter()));
};

Blocks.prototype.canDelete = function()
{
    // Don't allow deleting PG parameters
    if (this.selectedBlock != null) {
        var block = this.getBlockById(this.selectedBlock);
        if (block && block.isPgParameter()) {
            return false;
        }
    }

    return (this.selectedBlock != null || this.selectedLink != null);
};

/**
 * Delete the current link
 */
Blocks.prototype.deleteEvent = function()
{
    if (!this.canDelete()) {
        return;
    }

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
            console.error(error);
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
        if (block.isHovered && block.focusedField) {
            this.endLink(block, block.focusedField);
            break;
        }
    }
};

Blocks.prototype.addEdge = function(blockOut, fieldOut, blockIn, fieldIn, isDataChange = true) {
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

    // Check for loops or whether you want to connect the same fields
    var fromTo = edge.fromTo();
    if (fromTo[0] === fromTo[1]) {
        return;
    }
    else if (fromTo[1].allSuccessors().indexOf(fromTo[0].id) != -1) {
        throw 'You can not create a loop';
    }

    // Check type compatibility
    if (!JsonSchemaValidator.isSchemaCompatible(fieldIn.jsonSchema(), fieldOut.jsonSchema(), false, true)) {
        throw 'Incoming data type is not compatible for field "' + fieldIn.name + '" of block #' + blockIn.id;
    }
    // Check whether the data type allows multiple input edges
    if (fieldIn.getEdgeCount() > 0 && !fieldIn.allowsMultipleEdges()) {
        throw 'Parameter accepts only one input';
    }

    // Check whether the edge exists
    for (var k in this.edges) {
        var other = this.edges[k];
        if (other.same(edge)) {
            throw 'This connection exists already';
        }
    }

    // Create edges
    this.history.save();
    edge.create(isDataChange);
    this.edges.push(edge);

    // Update result node
    if (isDataChange) {
        this.setResultNode(fieldOut.isOutput() ? blockOut : blockIn, false);
    }

    this.linking = null;
    this.selectedBlock = null;
    blockIn.focusedField = null;
    blockOut.focusedField = null;

    // Update UI
    blockIn.redraw();
    blockOut.redraw();
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
};

Blocks.prototype.showError = function(message, title = null) {
    if (typeof this.errorHandler === 'function')  {
        this.errorHandler(message, title);
    }
    else {
        console.error(title, message);
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


Blocks.prototype.exportCustomProcess = function() {
    if (this.getProcessBlockCount() === 0) {
        return null;
    }

    var nodes = {};
    for(var blockId in this.blocks) {
        let node = this.blocks[blockId].exportCustomProcess();
        if (node !== null) {
            nodes[blockId] = node;
        }
    }

    var pg = {
        // ToDo: Add id, parameters, returns, etc.
    //  id: null,
    //  summary: null,
    //  description: null,
    //  categories: [],
    //  experimental: false,
    //  parameters: null,
    //  returns: null,
        process_graph: nodes,
    //  exceptions: [],
    //  examples: [],
    //  links: []
    };
    
    return pg;
};

Blocks.prototype.importCustomProcess = function(process, registry) {
    // Parse process 
    var pg;
    if (process instanceof ProcessGraph) {
        // Make a copy
        pg = new ProcessGraph(process.toJSON(), registry);
        pg.setParent(process.parentProcessId, process.parentParameterName);
    }
    else {
        pg = new ProcessGraph(process, registry);
    }
    pg.parse();

    // Import nodes
    this.importNodesFromCustomProcess(pg.getStartNodes());

    // Import edges
    var nodes = pg.getNodes();
    // iterating using for in loop causes error in edge
    Object.values(nodes).forEach(node => {
        var args = node.getArgumentNames();
        for(let i in args) {
            var val = node.getRawArgumentValue(args[i]);
            switch(node.getArgumentType(args[i])) {
                case 'result':
                    this.addEdge(pg.getNode(val).blockId, "output", node.blockId, args[i], false);
                    break;
                case 'parameter':
                    this.addEdge(this.getPgParameterBlockByName(val), "output", node.blockId, args[i], false);
                    break;
                case 'object':
                case 'array':
                    this.importEdgeDeep(val, pg, node, args, i);
                    break;
            }
        }
    });
};

Blocks.prototype.importEdgeDeep = function(val, pg, node, args, i) {
    for(let k in val) {
        if(val[k] && typeof val[k] === "object"){
            this.importEdgeDeep(val[k], pg, node, args, i);
        }
        else if (!Field.isRef(val)) {
            continue;
        }
        else if (val.from_node) {
            this.addEdge(pg.getNode(val.from_node).blockId, "output", node.blockId, args[i], false);
        }
        else if (val.from_parameter) {
            this.addEdge(this.getPgParameterBlockByName(val.from_parameter), "output", node.blockId, args[i], false);
        }
    }
};

Blocks.prototype.importNodesFromCustomProcess = function(nodes, x = 0, y = 0) {
    for(let i in nodes) {
        var node = nodes[i];
        if (node.blockId) {
            continue; // Node has already been added
        }

        var block = this.addProcess(node.process_id, x, y, node.id);
        block.result = node.isResultNode;
        block.comment = node.description;
        block.setValues(node.arguments, false, true);
        block.render();
        node.blockId = block.id;

        this.importNodesFromCustomProcess(node.getNextNodes(), x + block.getWidth() + 20, y);
        y += block.getHeight() + 20;
    }
};

Blocks.prototype.incrementId = function(id = null) {
    if (typeof id !== 'number' && (typeof id !== 'string' || id.length === 0)) {
        id = this.nextId;
        this.nextId++;
    }
    else if (!isNaN(parseInt(id))) {
        this.nextId = Math.max(this.nextId, parseInt(id)+1);
    }
    return id;
}

Blocks.prototype.addBlock = function(block) {
    if (block instanceof Block) {
        block.id = this.incrementId(block.id);
        block.create(this.innerDiv);
        this.blocks[block.id] = block;
    }
    else {
        throw "Parameter must be of type 'Block'";
    }
}

/**
 * Import some data
 */
Blocks.prototype.import = function(scene)
{
    this.clear();
    this.ready(() => {
        try {
            var errors = [];
            this.nextId = 1;
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
                    var block = new Block(this, data.name, data.type, this.moduleTypes[data.type][data.name], data.id);
                    block.x = data.x;
                    block.y = data.y;
                    block.comment = data.comment;
                    block.result = data.result;
                    block.setValues(data.values, true);
                    this.addBlock(block);
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
                    continue;
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
    this.scale = Math.min(scaleA, scaleB);
    this.center.x = rect.width/2 - this.scale*(xMin+xMax)/2.0;
    this.center.y = rect.height/2 - this.scale*(yMin+yMax)/2.0;
    this.newBlockOffset = 0;

    this.redraw();
}

export default Blocks;