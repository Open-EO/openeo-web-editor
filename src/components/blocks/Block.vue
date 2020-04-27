<template>
    <div :id="'block' + this.id" ref="div" :class="containerClasses" @mousedown.prevent.stop.left="select($event)" :style="styles">
        <div class="blockTitle" @mousedown.prevent.stop.left="emitDrag($event)">
            <span class="titleText" :title="name + (!showId ? '' : ' #' + id)">
                {{ name }}
                <span v-if="showId" class="blockId">#{{ id }}</span>
            </span>
            <div class="blockicon" @mousedown.prevent.stop.left="">
                <span v-show="allowsComment && !hasComment" class="addComment" title="Add comment" @click.stop.prevent="addComment()">
                    <i class="fas fa-comment-medical"></i>
                </span>
                <span v-show="allowsDelete" class="delete" title="Remove (DEL)" @click.stop.prevent="remove()">
                    <i class="fas fa-trash"></i>
                </span>
                <span v-show="allowsInfo" class="info" title="Details" @click.stop.prevent="showInfo()"><i class="fas fa-info"></i></span>
                <span v-show="allowsParameterChange" class="settings" title="Change parameter values" @click.stop.prevent="showParameters()">
                    <i class="fas fa-sliders-h"></i>
                </span>
            </div>
        </div>
        <div class="inout">
            <div class="inputs">
                <BlockParameter v-for="(param, i) in parameters" :key="i" :parent="templateThis" :value="args[param.name]" v-bind="param" />
            </div>
            <div class="outputs">
                <BlockParameter :parent="templateThis" :label="outputLabel" v-bind="output" />
            </div>
        </div>
        <textarea ref="commentField" v-if="hasComment" v-model="comment" class="editComment" placeholder="Type comment here..."
            @blur="updateComment($event)" @mousedown.stop=""></textarea>
    </div>
</template>

<script>
import BlocksState from './state.js';
import BlockParameter from './BlockParameter.vue';
import VueUtils from '@openeo/vue-components/utils.js';
import { ProcessGraph } from '@openeo/js-processgraphs';
import Utils from '../../utils.js';
import { ProcessParameter } from './processSchema';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import Vue from 'vue';

export default {
    name: 'Block',
	mixins: [EventBusMixin],
	components: {
        BlockParameter
	},
    props: {
        parent: {
            type: Object
        },
        id: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        value: {
            type: Object,
            required: true
        },
        spec: {
            type: Object,
            default: () => ({})
        },
        position: {
            type: Array,
            default: () => [0,0]
        }
    },
    data() {
        return Object.assign({
            data: Vue.observable(this.value),

            // Appareance values
            defaultFont: 10,

            // History saved before move
            historySaved: false,

            selected: false,

            // Is the user dragging ?
            drag: null,

            // Position
            x: this.position[0],
            y: this.position[1]
        }, BlocksState);
    },
    computed: {
        templateThis() {
            return this;
        },
        // Manage the node object (arguments, description, result)
        args: {
            set(value) {
                Vue.set(this.data, 'arguments', value);
            },
            get() {
                return Utils.isObject(this.data.arguments) ? this.data.arguments : {};
            }
        },
        comment: {
            set(value) {
                Vue.set(this.data, 'description', value);
            },
            get() {
                return this.data.description;
            }
        },
        // Visualizations
        height() {
            return 20 + this.parameters.length * 15;
        },
        width() {
            if (this.parameters.length > 0) {
                return this.state.compactMode ? 110 : 200;
            }
            else {
                return this.state.compactMode ? 60 : 110;
            }
        },
        styles() {
            return {
                marginLeft: Math.round(this.state.center[0] + this.x * this.state.scale) + 'px',
                marginTop: Math.round(this.state.center[1] + this.y * this.state.scale) + 'px',
                fontSize: Math.round(this.state.scale * this.defaultFont) + 'px',
                width: Math.round(this.state.scale * this.width) + 'px',
            };
        },
        name() {
            switch(this.type) {
                case 'process':
                    if (this.collectionId) {
                        return Utils.formatRef(this.collectionId);
                    }
                    else {
                        return this.processId;
                    }
                case 'parameter':
                    return this.spec.name;
                default:
                    return this.id;
            }
            return name;
        },
        outputLabel() {
            if (this.data.result) {
                return "Result";
            }
            else if (this.type === 'parameter') {
                return "Process Parameter";
            }
            else {
                return "Output";
            }
        },
        containerClasses() {
            var classes = ['block'];
            if (this.collectionId) {
                classes.push('block_collection');
            }
            else if (this.type === 'parameter') {
                classes.push('block_argument');
            }
            if (this.data.result) {
                classes.push('block_result');
            }
            if (this.selected) {
                classes.push('block_selected');
            }

            if (this.state.compactMode) {
                classes.push('compact');
            }

            if (this.state.scale < 0.5) {
                classes.push('scale_xs');
            }
            else if (this.state.scale < 0.7) {
                classes.push('scale_s');
            }
            else if (this.state.scale < 0.9) {
                classes.push('scale_m');
            }
            else if (this.state.scale < 1.1) {
                classes.push('scale_l');
            }

            return classes;
        },
        processId() {
            if (this.type === 'process') {
                return this.value.process_id || this.spec.id;
            }
            return null;
        },
        collectionId() {
            if (this.type === 'process' && this.processId === 'load_collection') {
                return this.args.id;
            }
            return null;
        },
        allowsParameterChange() {
            return (this.supports('showParameterEditor') && this.editables.length > 0 && this.type !== 'parameter');
        },
        allowsDelete() {
            return (!this.state.readOnly && this.type !== 'parameter');
        },
        allowsInfo() {
            if (this.collectionId) {
                // Has no info if it's a parameter
                return this.supports('showCollection') && !Utils.isRef(this.collectionId);
            }
            else if (this.type === 'parameter') {
                return this.supports('showSchema');
            }
            else {
                return this.supports('showProcess');
            }
        },
        allowsComment() {
            return (!this.state.readOnly && this.type === 'process');
        },
        hasComment() {
            return (typeof this.comment === 'string');
        },
        showId() {
            return (this.type !== 'parameter');
        },
        // Parameters and related
        parameters() {
            if (Utils.isObject(this.spec) && Array.isArray(this.spec.parameters) && this.spec.parameters.length > 0) {
                return this.spec.parameters;
            }
            else if (Utils.size(this.spec) > 0) {
                try {
                    var pg = new ProcessGraph(this.spec);
                    pg.parse();
                    return pg.getParameters();
                } catch (error) {
                    console.log(error);
                    return [];
                }
            }
            else if (Utils.size(this.args) > 0) {
                let parameters = [];
                for(var key in this.args) {
                    parameters.push({
                        name: key,
                        description: '',
                        schema: {}
                    });
                }
                return parameters;
            }
            else {
                return [];
            }
        },
        fields() {
            var fields = {};
            for(var p of this.parameters) {
                fields[p.name] = p;
            }
            return fields;
        },
        editables() {
            var editables = [];
            for(var p of this.parameters) {
                var field = new ProcessParameter(p);
                if (field.isEditable()) {
                    editables.push(p);
                }
            }
            return editables;
        },
        output() {
            var spec = {};
            if (this.type === 'parameter') {
                spec = this.spec;
            }
            else if (Utils.isObject(this.spec) && Utils.isObject(this.spec.returns)) {
                spec = this.spec.returns;
            }
            var output = {
                name: "output",
                schema: spec.schema || {},
                description: spec.description || '',
                optional: true,
                output: true
            };
            return output;
        }
    },
    mounted() {
        document.addEventListener('mousemove', () => this.dragging());
        document.addEventListener('mouseup', () => this.stopDrag());
        this.listen('blocks.startDrag', this.startDrag);
        this.listen('blocks.unselect', () => {this.selected = false});
    },
    methods: {
        select(event) {
            if (event && !event.shiftKey) {
                this.emit('blocks.unselect');
            }
            this.selected = true;
        },
        showParameters() {
            this.emit('blocks.showParameterEditor', this.parent, this, !this.state.readOnly, null);
        },
        showInfo() {
            if(this.collectionId) {
                this.emit('blocks.showCollection', this.collectionId);
            }
            else if (this.type === 'parameter') {
                this.emit('blocks.showSchema', this.name, this.spec.schema);
            }
            else {
                this.emit('blocks.showProcess', this.processId);
            }
        },
        addComment() {
            this.select();
            this.comment = "";
            this.$nextTick(() => this.$refs.commentField.focus());
        },
        updateComment(evt) {
            if (typeof evt.target.value === 'string' && evt.target.value.length > 0) {
                this.comment = evt.target.value;
            }
            else {
                this.comment = null;
            }
        },
        emitDrag(event) {
            this.select(event);
            this.emit('blocks.startDrag');
        },
        startDrag() {
            if (this.selected) {
                this.historySaved = false;
                this.drag = [this.state.mouse[0]/this.state.scale-this.x, this.state.mouse[1]/this.state.scale-this.y];
            }
        },
        stopDrag() {
            this.drag = null;
        },
        dragging() {
            if (this.drag) {
                if (!this.historySaved) {
                    this.parent.saveHistory();
                    this.historySaved = true;
                }
                this.x = (this.state.mouse[0]/this.state.scale-this.drag[0]);
                this.y = (this.state.mouse[1]/this.state.scale-this.drag[1]);
            }
        },

        setResult(val) {
            this.result = val;
        },

        hasOutputEdges() {
            return this.output.getEdgeCount() > 0;
        },

        remove() {
            this.emit('blocks.remove', this);
        },

        /**
         * Find all successors of a block, and their successors
         */
        allSuccessors() {
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

                        if (edge.block1 == currentBlock) {
                            var target = edge.block2;
                            
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
        },

        /**
         * Exports the block to JSON
         */
        export(internal = false) {
            if (this.type === 'parameter') {
                return undefined;
            }

    	    if (internal) {
                return Object.assign({
                    x: this.x,
                    y: this.y
                }, this.data);
            }
            else {
                return this.data;
            }
        },

        /**
         * Getting a field by name
         */
        getField(name) {
            return (name in this.fields ? this.fields[name] : null);
        },

        /**
         * Saves the form
         */
        save(serialize) {
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
        }
    }

}
</script>

<style scoped>
.block {
	position:absolute;
	border:2px solid #ccc;
	margin-left:0px;
	margin-top:0px;
	background-color:#fafafa;
	opacity:0.8;
	font-size:14px;
	-moz-user-select:none;
	-khtml-user-select:none;
	-webkit-user-select:none;
	-o-user-select:none;
}

.block .description {
	display:none;
	width:200px;
	padding:3px;
	border:1px solid #083776;
	border-radius:5px;
	color:#001531;
	background-color:#91bcf6;
	margin-top:15px;
	position:absolute;
	font-weight:normal;
}

.blockTitle {
	display: flex;
	padding: 0.3em 0.1em;
	font-weight:bold;
	background-color:#ddd;
	margin-bottom: 0.1em;
	cursor: move;
	font-size: 0.9em;
}

.titleText {
	flex-grow: 1;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.block .blockTitle .blockId {
	opacity:0.4;
	margin-left: 2px;
}

.block .blockicon
{
	white-space: nowrap;
	text-align: center;
}


.block .blockicon i
{
	min-width: 1.4em;
	cursor: pointer;
	opacity: 0.5;
	margin-left: 0.1em;
}

.block .blockicon i:hover {
	opacity:1.0;
}

.block_collection {
	border:2px solid #6B8DAF;
}

.block_collection .blockTitle {
	background-color:#A3B7CC;
}

.block_argument {
	border:2px solid #B28C6B;
}

.block_argument .blockTitle {
	background-color:#CCB7A3;
}

.block_selected {
	border:2px solid #0a0 !important; /* important  is used to override the styles for block_collection and block_argument above */
}

.block_selected .blockTitle {
	background-color:#0c0 !important;
}

.inout {
	display: flex;
}

.inputs {
	flex-grow: 1;
}
.editComment {
	padding: 0.3em 0.2em;
	box-sizing: border-box;
	font-size: 0.9em;
	line-height: 1em;
	overflow: auto;
	border: 0;
	border-top: 1px dotted #ccc;
	background-color: transparent;
	width: 100%;
	max-width: 100%;
	height: 3.7em;
	resize: none;
}
.editComment:focus {
	outline: 0;
}

.compact .blockicon .delete, .compact .blockicon .info, .compact .blockicon .addComment, .compact .blockId, .compact .editComment {
    display: none;
}

.scale_xs .blockicon, .scale_s .blockicon {
    display: none;

}
.scale_xs .editComment {
    visibility: hidden;
}


</style>