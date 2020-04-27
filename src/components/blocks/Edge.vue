<template>
    <g>
		<line v-for="(line, i) in lines" :key="i" :v-bind="line" />
    </g>
</template>

<script>
import BlocksState from './state.js';
import Segment from './segment.js';

export default {
    name: 'Edge',
    props: {
        id: {
            type: Number, // Should be Integer?!
            required: true,
        },
        parameter1: {
            type: Object,
            required: true
        },
        parameter2: {
            type: Object,
            required: true
        },
        lineWidth: {
            type: Number,
            default: 3
        }
    },
    data() {
        return Object.assign({
            selected: false
        }, BlocksState);
    },
    computed: {
        block1() {
            return this.parameter1.parent;
        },
        block2() {
            return this.parameter2.parent;
        },
        position1() {
            return this.parameter1.getCirclePosition();
        },
        position2() {
            return this.parameter2.getCirclePosition();
        },
        segment() {
            return new Segment(
                this.position1[0],
                this.position1[1], 
                this.position2[0] - this.position1[0],
                this.position2[1] - this.position1[1]
            );
        },
        scaledLineWidth() {
            return this.lineWidth * this.state.scale;
        },
        isDashed() {
            var parameter = this.parameter1.output ? this.parameter2 : this.parameter1;
            return !parameter.isEdgeUsed(this);
        },
        lines() {
            // Drawing the arrow
            var xM = ((this.position1.x+this.position2.x)/2.0);
            var yM = ((this.position1.y+this.position2.y)/2.0);
            var norm = Math.sqrt(Math.pow(this.position1.x-this.position2.x,2)+Math.pow(this.position1.y-this.position2.y,2));
            var alpha = (30*Math.PI/180.0);
            var cos = Math.cos(alpha);
            var sin = Math.sin(alpha);
            var cosB = Math.cos(-alpha);
            var sinB = Math.sin(-alpha);

            var xA = (this.position1.x-xM)*this.state.scale*10/(norm/2);
            var yA = (this.position1.y-yM)*this.state.scale*10/(norm/2);

            var lineStyle = this.getLineStyle(this.scaledLineWidth, this.selected, this.isDashed());
            var arrowStyle = this.getLineStyle(this.scaledLineWidth/3.0, this.selected);
            return [
                this.getLine(this.position1.x, this.position1.y, this.position2.x, this.position2.y, lineStyle),
                this.getLine(xM, yM, xM+(xA*cos-yA*sin), yM+(yA*cos+xA*sin), arrowStyle),
                this.getLine(xM, yM, xM+(xA*cosB-yA*sinB), yM+(yA*cosB+xA*sinB), arrowStyle)
            ];
        }
    },
    created() {
        if (!this.block1.getField(this.parameter1.name) || !this.block2.getField(this.parameter2.name)) {
            throw "Can't create edge because the field doesn't exist";
        }
    },
    methods: {
        getOtherBlock(block) {
            if (block === this.block1) {
                return this.block2;
            }
            else if (block === this.block2) {
                return this.block1;
            }
            return null;
        },
        getOtherField(field) {
            if (field === this.parameter1) {
                return this.parameter2;
            }
            else if (field === this.parameter2) {
                return this.parameter1;
            }
            return null;
        },
        getLineStyle(lineWidth, selected = false, dashed = false) {
            return {
                'stroke': selected ? 'rgba(0, 200, 0, 1)' : 'rgba(255, 200, 0, 1)',
                'stroke-width': lineWidth,
                'stroke-dasharray': dashed ? '4 2' : 'none'
            }
        },
		/**
		 * Get line options.
		 * 
		 * @param x1 {number} The x-coordinate for the start of the line.
		 * @param y1 {number} The y-coordinate for the start of the line.
		 * @param x2 {number} The x-coordinate for the end of the line.
		 * @param y2 {number} The y-coordinate for the end of the line.
		 * @param [settings] {object} Additional settings for this node.
		 * @return {object} Options for SVG Line
		 */
		getLine(x1, y1, x2, y2, settings = {}) {
			return Object.assign({x1, y1, x2, y2}, settings);
		},
        /**
         * Does the position collide the line ?
         */
        collide(x, y) {
            if (!this.segment) {
                return false;
            }

            var dp = this.segment.distanceP({x: x, y: y});

            if (dp[0] >= 0 && dp[0] <= 1) {
                if (dp[1] < (this.lineWidth*this.state.scale)*2) {
                    return dp[0];
                }
            }

            return false;
        },
        /**
         * Test if this edge is the same than another
         */
        equals(other) {
            if (this.block1 == other.block1 && this.block2 == other.block2 
                    && this.parameter1.name == other.parameter1.name
                    && this.parameter2.name == other.parameter2.name) {
                return true;
            }
            
            if (this.block1 == other.block1 && this.block2 == other.block2 
                    && this.parameter1.name == other.parameter2.name
                    && this.parameter2.name == other.parameter1.name) {
                return true;
            }

            return false;
        }
    }

}
</script>