import Segment from './segment.js';

export default class Edge {

    /**
     * An edge linking two blocks
     */
    constructor(id, block1, field1, block2, field2, blocks) {
        this.blocks = blocks;
        this.id = parseInt(id);
        this.block1 = block1;
        this.field1 = field1;
        this.block2 = block2;
        this.field2 = field2;
        this.selected = false;

        this.defaultSize = 3;

        this.position1 = null;
        this.position2 = null;
        this.segment = null;

        if (!block1.getField(field1.name) || !block2.getField(field2.name)) {
            throw "Can't create edge because the field doesn't exist";
        }
    }

    /**
     * Returns an array with the blocks ordered
     */
    fromTo() {
        return [this.block1, this.block2];
    }

    getOtherBlock(block) {
        if (block === this.block1) {
            return this.block2;
        }
        else if (block === this.block2) {
            return this.block1;
        }
        return null;
    }

    getOtherField(field) {
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
    draw(svg) {
        this.position1 = this.block1.linkPositionFor(this.field1.name);
        this.position2 = this.block2.linkPositionFor(this.field2.name);
        
        this.segment = new Segment(
            this.position1.x, this.position1.y, 
            this.position2.x-this.position1.x, this.position2.y-this.position1.y
        );

        var lineWidth = this.defaultSize*this.blocks.scale;
        svg.line(this.position1.x, this.position1.y, this.position2.x, this.position2.y, this.getLineStyle(lineWidth, this.selected, this.isDashed()));
        
        // Drawing the arrow
        var xM = ((this.position1.x+this.position2.x)/2.0);
        var yM = ((this.position1.y+this.position2.y)/2.0);
        var norm = Math.sqrt(Math.pow(this.position1.x-this.position2.x,2)+Math.pow(this.position1.y-this.position2.y,2));
        var alpha = 30;
        alpha = (alpha*Math.PI/180.0);
        var cos = Math.cos(alpha);
        var sin = Math.sin(alpha);
        var cosB = Math.cos(-alpha);
        var sinB = Math.sin(-alpha);

        var xA = (this.position1.x-xM)*this.blocks.scale*10/(norm/2);
        var yA = (this.position1.y-yM)*this.blocks.scale*10/(norm/2);
        var arrowStyle = this.getLineStyle(lineWidth/3.0, this.selected);
        svg.line(xM, yM, xM+(xA*cos-yA*sin), yM+(yA*cos+xA*sin), arrowStyle);
        svg.line(xM, yM, xM+(xA*cosB-yA*sinB), yM+(yA*cosB+xA*sinB), arrowStyle);
    }

    getLineStyle(lineWidth, selected = false, dashed = false) {
        return {
            'stroke': selected ? 'rgba(0, 200, 0, 1)' : 'rgba(255, 200, 0, 1)',
            'stroke-width': lineWidth,
            'stroke-dasharray': dashed ? '4 2' : 'none'
        }
    }

    /**
     * Does the position collide the line ?
     */
    collide(x, y) {
        if (!this.segment) {
            return false;
        }

        var dp = this.segment.distanceP({x: x, y: y});

        if (dp[0] >= 0 && dp[0] <= 1) {
            if (dp[1] < (this.defaultSize*this.blocks.scale)*2) {
                return dp[0];
            }
        }

        return false;
    }

    /**
     * Initializes the edge and do some tests
     */ 
    create(isDataChange = true) {
        // You can't link a block to itself
        if (this.block1 == this.block2) {
            throw 'You can\'t link a block to itself';
        }

        // You have to link an input with an output
        if (this.field1.type == this.field2.type) {
            throw 'You have to link an input with an output';
        }

        this.field1.addEdge(this, isDataChange);
        this.field2.addEdge(this, isDataChange);
        this.block1.render();
        this.block2.render();
    }

    /**
     * Get the types of the blocks
     */
    getDataTypes() {
        return [this.field1.dataTypes(), this.field2.dataTypes()];
    }

    /**
     * Erase an edge
     */
    erase() {
        this.field1.eraseEdge(this);
        this.field2.eraseEdge(this);
        this.block1.render();
        this.block2.render();
    }

    isDashed() {
        var field = this.field1.isInput() ? this.field1 : this.field2;
        return !field.isEdgeUsed(this);
    }

    /**
     * Test if this edge is the same than another
     */
    same(other) {
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
    }

    /**
     * Exports the edge to JSON
     */
    export() {
        return {
            id: this.id,
            block1: this.block1.id,
            field1: this.field1.name,
            block2: this.block2.id,
            field2: this.field2.name
        };
    }

}
