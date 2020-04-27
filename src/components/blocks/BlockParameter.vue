<template>
    <div :class="classes" v-on="listeners">
        <div v-if="!output" ref="circle" :class="circleClasses" v-on="circleListeners"></div>
            <span class="text">
                {{ displayLabel }}<template v-if="displayValue.length">: </template>
                <span v-html="displayValue"></span>
            </span>
        <div v-if="output" ref="circle" :class="circleClasses" v-on="circleListeners"></div>
    </div>
</template>

<script>
import BlocksState from './state.js';
import { ProcessSchema } from './processSchema.js';
import Utils from '../../utils.js';
import { ProcessGraph } from '@openeo/js-processgraphs';
import { Utils as VueUtils } from '@openeo/vue-components';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';

const MULTI_INPUT_TYPES = ['array', 'object', 'bounding-box', 'kernel', 'output-format-options', 'process-graph', 'process-graph-variables', 'temporal-interval', 'temporal-intervals'];

export default {
    name: 'BlockParameter',
	mixins: [EventBusMixin],
    props: {
        parent: {
            type: Object,
            required: true
        },
        name: {
            type: String,
            default: 'output'
        },
        description: {
            type: String,
            default: ''
        },
        optional: {
            type: Boolean,
            default: false
        },
        deprecated: {
            type: Boolean,
            default: false
        },
        experimental: {
            type: Boolean,
            default: false
        },
        default: {},
        value: {},
        schema: {
            type: Object | Array,
            default: {}
        },
        label: {
            type: String
        },
        output: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return Object.assign({
            block: null,
            edges: []
        }, BlocksState);
    },
    computed: {
        schemas() {
            if (this.schema instanceof ProcessSchema) {
                return this.schema;
            }
            else {
                return new ProcessSchema(this.schema);
            }
        },
        hasValue() {
            return (this.value !== undefined);
        },
        listeners() {
            if (this.allowsParameterChange) {
                return {
                    dblclick: this.openEditorForParameter
                };
            }
            else {
                return {};
            }
        },
        circleListeners() {
            var listeners = {};
            if (!this.state.readOnly) {
                listeners.mousedown = event => {
                    if (event.which == 1) {
                        this.link(this);
                        event.preventDefault();
                        event.stopPropagation();
                    }
                };

                if (this.output) {
                    // Allow specifying the result node
                    listeners.click = event => {
                        if (event.which == 1) {
                            if (this.getEdgeCount() > 0) {
                                this.emit("blocks.error", "A result node can't have outgoing edges.");
                                return;
                            }
                            this.parent.parent.setResultNode(this.parent);
                        }
                    };
                }

                // Handle focus on the I/Os
                listeners.mouseover = () => this.link(this);
                listeners.mouseout = () => this.unlink(this);
            }
            return listeners;
        },
        classes() {
            return [
                this.output ? 'output' : 'input',
                'connector',
                'field_' + this.name,
                ((this.hasValue || this.optional || this.output || this.getEdgeCount() > 0) ? 'hasValue' : 'noValue')
            ];
        },
        circleClasses() {
            var classes = ['circle'];
            if (this.getEdgeCount() > 0) {
                classes.push('io_active');
            }

            var edges = this.getEdges();
            for (var n in edges) {
                if (edges[n].selected) {
                    classes.push('io_selected');
                }
            }

            if (this.state.linkFrom == this || this.state.linkTo == this) {
                classes.push('io_selected');
            }
            return classes;
        },
        displayValue() {
            var maxLength = 25 - this.displayLabel.length;
            var formattedValue = null;
            if (this.isEditable && !this.state.compactMode && !Utils.isRef(this.value)) {
                formattedValue = this.formatValue(this.value, maxLength, true);
            }

            if (typeof formattedValue === 'string') {
                if (formattedValue.length === 0) {
                    formattedValue = '<em>Empty</em>';
                }
            }
            else {
                formattedValue = '';
            }
            return formattedValue;
        },
        displayLabel() {
            if (this.output && this.state.compactMode) {
                return '';
            }
            else if (typeof this.label === 'string' && this.label.length > 0) {
                return this.label;
            }
            else {
                return this.name;
            }
        },
        isDefaultValue() {
            return !this.hasValue || typeof this.default !== 'undefined' && this.default == this.getValue(); // Don't do ===, otherwise empty objects are not recognized as the same.
        },

        isArrayType() {
            return this.schemas.nativeDataType() === 'array';
        },

        isObjectType() {
            return this.schemas.nativeDataType() === 'object';
        },
        
        isEditable() {
            return !this.output && this.schemas.isEditable();
        },
        allowsParameterChange() {
            return (!this.output && this.supports('showParameterEditor') && this.schemas.isEditable());
        },
    },
    methods: {
        getCirclePosition() {
            var dim = Utils.domBoundingBox(this.$refs.circle);
            var blocksDim = this.parent.parent.getDim();
            var x = (dim.offsetLeft-blocksDim.offsetLeft)+dim.width/2;
            var y = (dim.offsetTop-blocksDim.offsetTop)+dim.height/2;
            return [x, y];
        },

        openEditorForParameter() {
            if (this.allowsParameterChange) {
                this.emit('showParameterEditor', this.parent.parent, this.parent, !this.state.readOnly, this.name);
            }
        },

        jsonSchema() {
            return this.schemas.toJSON();
        },
    
        allowsMultipleInputs() {
            // Is there any type that potentially allows multiple inputs?
            return this.dataTypes().filter(t => MULTI_INPUT_TYPES.includes(t)).length > 0;
        },

        resetValue() {
            if (typeof this.default !== 'undefined') {
                this.setValue(this.default);
                return;
            }
            
            var value;
            if (this.nullable()) {
                value = null;
            }
            else {
                var dataType = this.nativeDataType();
                switch(dataType) {
                    case 'array':
                        value = [];
                        break;
                    case 'string':
                        value = '';
                        break;
                    case 'integer':
                    case 'number':
                        value = 0;
                        break;
                    case 'boolean':
                        value = false;
                        break;
                    default:
                        value = null;
                }
            }
            this.setValue(value, false);
        },

        _getEdgeRef(edge) {
            var otherBlock = edge.getOtherBlock(this.parent);
            if (!otherBlock) {
                return null;
            }
            else if (otherBlock.isPgParameter) {
                return {
                    from_parameter: String(otherBlock.name)
                };
            }
            else {
                return {
                    from_node: String(otherBlock.id)
                };
            }
        },

        _addValueForEdge(edge) {
            var ref = this._getEdgeRef(edge);
            if (!ref) {
                return;
            }
            else if (!this.allowsMultipleInputs()) {
                this.setValue(ref);
            }
            else if (this.isArrayType) {
                if (Utils.isRef(this.value)) {
                    this.setValue([this.value, ref]);
                }
                else if (Array.isArray(this.value) && this.value.length > 0) {
                    var value = this.value;
                    value.push(ref);
                    this.setValue(value);
                }
                else {
                    this.setValue(ref);
                }
            }
            else if (this.isObjectType()) {
                var hasNoKeys = (this.value && typeof this.value === 'object' && Object.keys(this.value).length === 0);
                if (this.getEdgeCount() === 1 && (!this.hasValue || hasNoKeys)) {
                    this.setValue(ref);
                }
                else if (hasNoKeys) {
                    this.resetValue();
                }
            }
            else {
                // ToDo: This is probably of data type mixed or any, how to handle?
                this.setValue(ref);
            }
        },

        _removeValueForEdge(edge) {
            // ToDo: Check whether this should only be executed for input fields
            var ref = this._getEdgeRef(edge);
            if (Utils.isRefEqual(ref, this.value)) {
                this.resetValue();
            }
            else if (this.isArrayType || this.isObjectType) {
                this.setValue(this._removeValueForEdgeDeep(this.value, ref));
            }
        },

        _removeValueForEdgeDeep(value, ref) {
            if (Array.isArray(value)) {
                var i = value.length;
                while(--i >= 0) {
                    if (value[i] === null || typeof value[i] !== 'object') {
                        continue;
                    }
                    else if (Utils.isRefEqual(ref, value[i])) {
                        value.splice(i, 1);
                    }
                    else {
                        value[i] = this._removeValueForEdgeDeep(value[i], ref);
                    }
                }

            }
            else if (Utils.isObject(value)) {
                for(var key in value) {
                    if (!value.hasOwnProperty(key) || value[key] === null || typeof value[key] !== 'object') {
                        continue;
                    }
                    else if (Utils.isRefEqual(ref, value[key])) {
                        delete value[key];
                    }
                    else {
                        value[i] = this._removeValueForEdgeDeep(value[key], ref);
                    }
                }
            }
            return value;
        },

        addEdge(edge, isDataChange = true) {
            this.edges.push(edge);
            if (isDataChange && !this.output) {
                this._addValueForEdge(edge);
            }
            return this; // Allow chaining
        },

        eraseEdge(edge) {
            for (var k in this.edges) {
                if (this.edges[k] == edge) {
                    this._removeValueForEdge(edge);
                    Vue.delete(this.edges, k);
                    return true;
                }
            }
            return false;
        },

        isEdgeUsed(edge) {
            var ref = this._getEdgeRef(edge);
            if (Utils.isRefEqual(ref, this.value)) {
                return true;
            }
            return this._findRefInValue(ref, this.value);
        },

        _findRefInValue(ref, value) {
            if (!value || typeof value !== 'object') {
                return false;
            }
            else if (Utils.isRefEqual(ref, value)) {
                return true;
            }
            for(let key in value) {
                if (this._findRefInValue(ref, value[key])) {
                    return true;
                }
            }
            return false;
        },

        getRefs() {
            var obj = {
                from_node: [],
                from_parameter: []
            };
            for(var i in this.edges) {
                var ref = this._getEdgeRef(this.edges[i]);
                if (ref.from_parameter) {
                    obj.from_parameter.push(ref.from_parameter);
                }
                else if (ref.from_node) {
                    obj.from_node.push(ref.from_node);
                }
            }
            return obj;
        },

        getRefsInValue() {
            var obj = {
                from_node: [],
                from_parameter: []
            };
            return this._getRefsInValue(obj, ref);
        },

        _getRefsInValue(obj, value) {
            if (!value || typeof value !== 'object') {
                return false;
            }
            for(let key in value) {
                if (key === 'from_parameter' || key === 'from_node') {
                    obj[key].push(value[key]);
                }
                this._getRefsInValue(obj, value[key]);
            }
            return obj;
        },

        getEdgeCount() {
            return this.edges.length;
        },

        getEdges() {
            return this.edges;
        },

        setValue(value) {
            if (this.schemas.nativeDataType() == 'boolean') {
                value = !!value;
            }
            this.$emit('input', value);
        },

        formatProcess(pg) {
            if (pg.getNodeCount() === 1) {
                return VueUtils.htmlentities(pg.getResultNode().process_id);
            }
            else {
                return 'Process';
            }
        },

        formatValue(value, maxLength, html = true) {
            var formattedValue = null;
            if (typeof value === 'object') {
                if (value === null) {
                    formattedValue = 'N/A';
                }
                else if (Array.isArray(value)) {
                    formattedValue = this.formatArray(value, maxLength, html);
                }
                else {
                    formattedValue = this.formatObject(value, html);
                }
            }
            else if (typeof value === 'string') {
                if (value.length > maxLength) {
                    var text = VueUtils.htmlentities(value.substr(0, maxLength)) + '…';
                    formattedValue = html ? '<span title="' + VueUtils.htmlentities(value) + '">' + text + '…</span>' : text;
                }
                else {
                    formattedValue = VueUtils.htmlentities(value);
                }
            }
            else if (typeof value === 'boolean') {
                formattedValue = value ? '✔️' : '❌';
            }
            else if (typeof value === 'number') {
                formattedValue = value.toString();
            }
            else {
                formattedValue = VueUtils.htmlentities(JSON.stringify(value));
            }
            return formattedValue;
        },

        formatArray(value, maxLength, html = true) {
            var formatted = value.map(v => this.formatValue(v, 25, false)).join(", ");
            // ToDo: htmlentities_decode is only available in a more recent version, remove condition once dependency has been updated.
            var unformatted = formatted;
            if (typeof VueUtils.htmlentities_decode === 'function') {
                unformatted = VueUtils.htmlentities_decode(formatted);
            }
            if (unformatted.length > 0 && unformatted.length <= maxLength) {
                return "[" + formatted + "]";
            }
            else {
                var text = 'List(' + value.length + ')';
                return html ? '<span title="' + formatted + '">' + text + '</span>' : text;
            }
        },

        formatObject(value, html = true) {
            if (Object.keys(value).length === 0) {
                return 'None';
            }
            else if (value instanceof ProcessGraph) {
                return this.formatProcess(value);
            }
            else if (Utils.isRef(value)) {
                return Utils.formatRef(value);
            }
            else if (typeof value.west !== 'undefined' && typeof value.east !== 'undefined' && typeof value.south !== 'undefined' && typeof value.north !== 'undefined') {
                return 'Bounding Box';
            }
            else if (Utils.validateGeoJsonSimple(value)) {
                return value.type;
            }

            // Fallback to default
            return html ? '<span title="' + VueUtils.htmlentities(JSON.stringify(value)) + '">Object</span>' : 'Object';
        },
    }
}
</script>

<style scoped>
.block_collection .field_id { /* Hide collection ID as it's shown in the title */
	display: none;
}

.output {
	text-align: right;
}

.connector {
	font-size: 0.9em;
	margin: 0.2em 0;
	background-repeat: no-repeat;
	width: 100%;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}
.input.connector {
	cursor: pointer;
}
.connector.noValue {
	color: red;
}
.scale_xs .connector .text {
    display: none;
}

.circle {
	width: 0.8em;
	height: 0.8em;
	margin: 0 0.2em;
	border: 1px solid #888;
	background-color: transparent;
	display: inline-block;
}

.block_result .field_output .circle {
	background-color: #888;
    cursor: auto;
}
.field_output .circle {
	cursor: pointer;
}

.circle.io_active {
	background-color: #FFC800;
}

.circle.io_selected {
	background-color: #00C800 !important;
}

</style>