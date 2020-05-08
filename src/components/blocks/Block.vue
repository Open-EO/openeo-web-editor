<template>
    <div :id="'block' + this.id" ref="div" :class="containerClasses" @mousedown.prevent.stop.left="select($event)" :style="styles">
        <div class="blockTitle" @mousedown.prevent.stop.left="emitDrag($event)">
            <span class="titleText" :title="plainTitle">
                {{ name }}
                <span v-if="showId" class="blockId">#{{ id }}</span>
            </span>
            <div class="blockicon" @mousedown.prevent.stop.left="focus()">
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
                <BlockParameter v-for="(param, i) in parameters" :key="i" ref="parameters" :state="state" v-model="args[param.name]" v-bind="param" />
            </div>
            <div class="outputs">
                <BlockParameter ref="output" :state="state" :label="outputLabel" v-bind="output" />
            </div>
        </div>
        <textarea ref="commentField" v-if="hasComment" v-model="comment" class="editComment" placeholder="Type comment here..."
            @blur="updateComment($event)" @mousedown.stop="focus()"></textarea>
    </div>
</template>

<script>
import BlockParameter from './BlockParameter.vue';
import VueUtils from '@openeo/vue-components/utils.js';
import { ProcessGraph } from '@openeo/js-processgraphs';
import Utils from '../../utils.js';
import { ProcessParameter } from './processSchema';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import Vue from 'vue';

/*
Events:

Emits locally:
- moved(x, y) - The block has been moved
*/

const defaultFontSize = 10;

export default {
    name: 'Block',
    mixins: [EventBusMixin],
    components: {
        BlockParameter
    },
    props: {
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
        state: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            data: {},

            // History saved before move
            historySaved: false,

            // Is the user dragging ?
            drag: null
        };
    },
    watch: {
        'state.compactMode'() {
            this.$emit('moved', this.x, this.y);
        },
        value: {
            immediate: true,
            handler(value) {
                this.data = Vue.observable(value);
            }
        }
    },
    computed: {
        // Manage the node object (arguments, description, result, x, y, selected)
        x: {
            set(value) {
                this.$set(this.data, 'x', value);
                this.$emit('input', this.getValue());
                this.$emit('moved', this.x, this.y);
            },
            get() {
                return this.data.x || 0;
            }
        },
        y: {
            set(value) {
                this.$set(this.data, 'y', value);
                this.$emit('input', this.getValue());
                this.$emit('moved', this.x, this.y);
            },
            get() {
                return this.data.y || 0;
            }
        },
        selected: {
            set(value) {
                this.$set(this.data, 'selected', value);
                this.$emit('input', this.getValue());
            },
            get() {
                return this.data.selected || false;
            }
        },
        args: {
            set(value) {
                this.$set(this.data, 'arguments', value);
                this.$emit('input', this.getValue());
            },
            get() {
                return Utils.isObject(this.data.arguments) ? this.data.arguments : {};
            }
        },
        comment: {
            set(value) {
                this.$set(this.data, 'description', value);
                this.$emit('input', this.getValue());
            },
            get() {
                return this.data.description;
            }
        },
        result: {
            set(value) {
                this.$set(this.data, 'result', value);
                this.$emit('input', this.getValue());
            },
            get() {
                return this.data.result || false;
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
                fontSize: Math.round(this.state.scale * defaultFontSize) + 'px',
                width: Math.round(this.state.scale * this.width) + 'px',
            };
        },
        plainTitle() {
            return this.name + (!this.showId ? '' : ' #' + this.id);
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
            if (this.result) {
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
            if (this.result) {
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
            return (this.$parent.supports('editParameters') && this.editables.length > 0 && this.type !== 'parameter');
        },
        allowsDelete() {
            return (this.state.editable && this.type !== 'parameter');
        },
        allowsInfo() {
            if (this.collectionId) {
                // Has no info if it's a parameter
                return this.$parent.supports('showCollection') && !Utils.isRef(this.collectionId);
            }
            else if (this.type === 'parameter') {
                return this.$parent.supports('showSchema');
            }
            else {
                return this.$parent.supports('showProcess');
            }
        },
        allowsComment() {
            return (this.state.editable && this.type === 'process');
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
            fields.output = this.output;
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
        // ToDo: Move mousemove listener for dragging to Blocks?
        document.addEventListener('mousemove', () => this.dragging());
        // ToDO: Replace with mouseleave?
        document.addEventListener('mouseup', () => this.stopDrag());
        this.listen('blocks.startDrag', this.startDrag);
    },
    methods: {
        getValue() {
            return Object.assign({}, this.data, {
                x: this.x,
                y: this.y,
                selected: this.selected
            })
        },
        focus() {
            this.$parent.focus();
        },
        select(event) {
            this.$parent.unselectAll(event);
            this.selected = true;
            this.focus();
        },
        showParameters(parameterName = null) {
            this.$parent.$emit('editParameters', this.editables, this.args, this.plainTitle, this.state.editable, parameterName, data => this.args = data, this.processId);
        },
        showInfo() {
            if(this.collectionId) {
                this.$parent.$emit('showCollection', this.collectionId);
            }
            else if (this.type === 'parameter') {
                this.$parent.$emit('showSchema', this.name, this.spec.schema);
            }
            else {
                this.$parent.$emit('showProcess', this.processId);
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
            this.focus();
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
                    this.$parent.saveHistory();
                    this.historySaved = true;
                }
                this.x = (this.state.mouse[0]/this.state.scale-this.drag[0]);
                this.y = (this.state.mouse[1]/this.state.scale-this.drag[1]);
            }
        },

        isResult() {
            return this.result;
        },
        setResult(val) {
            this.result = val;
        },

        hasOutputEdges() {
            return this.$refs.output && this.$refs.output.getEdgeCount() > 0;
        },

        remove() {
            this.$parent.removeBlock(this);
        },

        /**
         * Getting a field by name
         */
        getBlockParameter(name) {
            if (name === 'output' && this.$refs.output) {
                return this.$refs.output;
            }
            else if (Array.isArray(this.$refs.parameters)) {
                var params = this.$refs.parameters.filter(param => param.name === name);
                if (params.length > 0) {
                    return params[0];
                }
            }
            return null;
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