import Segment from './segment.js';

/**
 * An edge linking two blocks
 */
var Edge = function(id, block1, field1, block2, field2, blocks)
{
    this.blocks = blocks;
    this.id = parseInt(id);
    this.block1 = block1;
    this.field1 = field1;
    this.block2 = block2;
    this.field2 = field2;
    this.selected = false;

    this.defaultSize = 3;
    this.defaultFontSize = 10;

    this.position1 = null;
    this.position2 = null;
    this.segment = null;

    if (!block1.getField(field1.name) || !block2.getField(field2.name)) {
        throw "Can't create edge because the field doesn't exist";
    }
};

/**
 * Returns an array with the blocks ordered
 */
Edge.prototype.fromTo = function()
{
    return [this.block1, this.block2];
};

Edge.prototype.getOtherBlock = function(block) {
    if (block === this.block1) {
        return this.block2;
    }
    else if (block === this.block2) {
        return this.block1;
    }
    return null;
}

Edge.prototype.getOtherField = function(field) {
    if (field === this.field1) {
        return this.field2;
    }
    else if (field === this.field2) {
        return this.field1;
    }
    return null;
}

/**
 * Draws the edge
 */
Edge.prototype.draw = function(svg)
{
    this.position1 = this.block1.linkPositionFor(this.field1.name);
    this.position2 = this.block2.linkPositionFor(this.field2.name);
    
    this.segment = new Segment(
        this.position1.x, this.position1.y, 
        this.position2.x-this.position1.x, this.position2.y-this.position1.y
    );

    var lineWidth = this.defaultSize*this.blocks.scale;

    if (this.selected) {
        var strokeStyle = 'rgba(0, 200, 0, 1)';
    } else {
        var strokeStyle = 'rgba(255, 200, 0, 1)';
    }
    svg.line(this.position1.x, this.position1.y, this.position2.x, this.position2.y, {
        'stroke': strokeStyle, 'stroke-width': lineWidth
    });
    
    var xM = ((this.position1.x+this.position2.x)/2.0);
    var yM = ((this.position1.y+this.position2.y)/2.0);
    var norm = Math.sqrt(Math.pow(this.position1.x-this.position2.x,2)+Math.pow(this.position1.y-this.position2.y,2));
    var alpha = 30;
    alpha = (alpha*Math.PI/180.0);
    var cos = Math.cos(alpha);
    var sin = Math.sin(alpha);
    var cosB = Math.cos(-alpha);
    var sinB = Math.sin(-alpha);

    // Drawing the arrow
    var xA = (this.position1.x-xM)*this.blocks.scale*10/(norm/2);
    var yA = (this.position1.y-yM)*this.blocks.scale*10/(norm/2);
    var lineWidth = this.defaultSize*this.blocks.scale/3.0;
    svg.line(xM, yM, xM+(xA*cos-yA*sin), yM+(yA*cos+xA*sin), {
        'stroke': strokeStyle, 'stroke-width': lineWidth
    });
    svg.line(xM, yM, xM+(xA*cosB-yA*sinB), yM+(yA*cosB+xA*sinB), {
        'stroke': strokeStyle, 'stroke-width': lineWidth
    });
};

/**
 * Does the position collide the line ?
 */
Edge.prototype.collide = function(x, y)
{
    var dp = this.segment.distanceP({x: x, y: y});

    if (dp[0] >= 0 && dp[0] <= 1) {
        if (dp[1] < (this.defaultSize*this.blocks.scale)*2) {
            return dp[0];
        }
    }

    return false;
};

/**
 * Initializes the edge and do some tests
 */ 
Edge.prototype.create = function()
{
    // You can't link a block to itself
    if (this.block1 == this.block2) {
        throw 'You can\'t link a block to itself';
    }

    // You have to link an input with an output
    if (this.field1.type == this.field2.type) {
        throw 'You have to link an input with an output';
    }

    this.block1.addEdge(this.field1.name, this);
    this.block2.addEdge(this.field2.name, this);
    this.block1.render();
    this.block2.render();
};

/**
 * Get the types of the blocks
 */
Edge.prototype.getDataTypes = function()
{
    return [this.field1.dataTypes(), this.field2.dataTypes()];
};

/**
 * Erase an edge
 */
Edge.prototype.erase = function()
{
    this.block1.eraseEdge(this.field1.name, this);
    this.block2.eraseEdge(this.field2.name, this);
    this.block1.render();
    this.block2.render();
};

/**
 * Test if this edge is the same than another
 */
Edge.prototype.same = function(other)
{
    if (this.block1 == other.block1 && this.block2 == other.block2 
            && this.field1.name == other.field1.name
            && this.field2.name == other.field2.name) {
        return true;
    }
    
    if (this.block1 == other.block1 && this.block2 == other.block2 
            && this.field1.name == other.field2.name
            && this.field2.name == other.field1.name) {
        return true;
    }

    return false;
};

/**
 * Exports the edge to JSON
 */
Edge.prototype.export = function()
{
    return {
        id: this.id,
        block1: this.block1.id,
        field1: this.field1.name,
        block2: this.block2.id,
        field2: this.field2.name
    };
};

export default Edge;