<template>
    <g>
        <line v-for="(line, i) in lines" :key="i" v-bind="line" />
    </g>
</template>

<script>
import Segment from './segment.js';

export default {
    name: 'Edge',
    props: {
        id: {
            type: Number, // Should be Integer?!
            required: true
        },
        parameter1: {
            type: Object,
            required: true
        },
        parameter2: {
            type: Object,
            required: true
        },
        selected: {
            type: Boolean,
            default: false
        },
        inactive: {
            type: Boolean,
            default: false
        },
        lineWidth: {
            type: Number,
            default: 3
        },
        state: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            position1: null,
            position2: null
        }
    },
    computed: {
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
        lines() {
            // Drawing the arrow
            var xM = ((this.position1[0]+this.position2[0])/2.0);
            var yM = ((this.position1[1]+this.position2[1])/2.0);

            var alpha = (35*Math.PI/180.0);
            var cos = Math.cos(alpha);
            var sin = Math.sin(alpha);
            var cosB = Math.cos(-alpha);
            var sinB = Math.sin(-alpha);

            var norm = Math.sqrt(Math.pow(this.position1[0]-this.position2[0],2)+Math.pow(this.position1[1]-this.position2[1],2));
            var arrowLength = this.state.scale*10/(norm/1.5);
            var xA = (this.position1[0]-xM)*arrowLength;
            var yA = (this.position1[1]-yM)*arrowLength;

            var lineStyle = this.getLineStyle(this.scaledLineWidth, this.selected, this.inactive);
            var arrowStyle = this.getLineStyle(this.scaledLineWidth / 1.5, this.selected);

            var mainLine = this.getLine(this.position1[0], this.position1[1], this.position2[0], this.position2[1], lineStyle);
            if (this.inactive || norm/this.state.scale < 25) {
                // Hide arrow
                return [mainLine];
            }
            else {
                return [
                    mainLine,
                    this.getLine(xM, yM, xM+(xA*cos-yA*sin), yM+(yA*cos+xA*sin), arrowStyle),
                    this.getLine(xM, yM, xM+(xA*cosB-yA*sinB), yM+(yA*cosB+xA*sinB), arrowStyle)
                ];
            }
        }
    },
    watch: {
        'state.center'() {
            this.updatePositions();
        },
        'state.scale'() {
            this.updatePositions();
        },
        'state.moving'() {
            this.updatePositions();
        }
    },
    created() {
        this.updatePositions();
    },
    methods: {
        updatePositions() {
            let pos1 = this.parameter1.getCirclePosition();
            let pos2 = this.parameter2.getCirclePosition();
            if (!this.position1 || !this.position2 || pos1[0] !== this.position1[0] || pos1[1] !== this.position1[1] || pos2[0] !== this.position2[0] || pos2[1] !== this.position2[1]) {
                this.position1 = pos1;
                this.position2 = pos2;
                this.$emit('position', this.position1, this.position2);
            }
        },
        getLineStyle(lineWidth, selected = false, dashed = false) {
            let dashLength = 2 * this.state.scale;
            return {
                'stroke': selected ? 'rgba(0, 200, 0, 1)' : 'rgba(255, 200, 0, 1)',
                'stroke-width': lineWidth,
                'stroke-dasharray': dashed ? dashLength * 3 + ' ' + dashLength * 2 : 'none'
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
            if (this.parameter1 == other.parameter1 && this.parameter2 == other.parameter2) {
                return true;
            }
            else if (this.parameter1 == other.parameter2 && this.parameter2 == other.parameter1) {
                return true;
            }

            return false;
        }
    }

}
</script>