<template>
    <div :class="classes" v-on="listeners">
        <div v-if="!output" ref="circle" :class="circleClasses" v-on="circleListeners"></div>
        <span class="text">
            <span v-show="unspecified" class="unspecified" title="Parameter is likely unsupported!">
                <i class="fas fa-exclamation-triangle"></i>
            </span>
            {{ displayLabel }}<template v-if="displayValue.length">: </template>
            <span v-html="displayValue"></span>
        </span>
        <div v-if="output" ref="circle" :class="circleClasses" v-on="circleListeners"></div>
    </div>
</template>

<script>
import { ProcessSchema } from './processSchema.js';
import Utils from '../../utils.js';
import { ProcessGraph } from '@openeo/js-processgraphs';

export default {
    name: 'BlockParameter',
    props: {
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
            type: [Object, Array],
            default: null
        },
        label: {
            type: String
        },
        output: {
            type: Boolean,
            default: false
        },
        state: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            // The attached edges
            edges: []
        };
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
            if (this.state.editable) {
                listeners.mousedown = event => {
                    if (event.which == 1) {
                        this.state.root.link(this);
                        event.preventDefault();
                        event.stopPropagation();
                    }
                };

                if (this.output) {
                    // Allow specifying the result node
                    listeners.click = event => {
                        if (event.which == 1) {
                            // ToDo: Move out of here...
                            if (this.getEdgeCount() > 0) {
                                this.state.root.$emit("error", "A result node can't have outgoing edges.");
                                return;
                            }
                            this.state.root.setResultNode(this.$parent);
                        }
                    };
                }

                // Handle focus on the I/Os
                listeners.mouseover = () => this.state.linkFrom && this.state.root.link(this);
                listeners.mouseout = () => this.state.linkTo && this.state.root.unlink(this);
            }
            return listeners;
        },
        classes() {
            return [
                this.output ? 'output' : 'input',
                'connector',
                'field_' + this.name,
                (this.hasValue || this.optional || this.output || this.getEdgeCount() > 0) ? 'hasValue' : 'noValue'
            ];
        },
        unspecified() {
            return !this.$parent.invalid && this.state.root.hasProcesses && this.schemas.unspecified;
        },
        circleClasses() {
            var classes = ['circle'];
            if (this.getEdgeCount() > 0) {
                classes.push('io_active');
            }

            var edges = this.edges;
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
            if (this.isEditable && !this.state.compactMode && !Utils.isRef(this.value) && typeof this.value !== 'undefined') {
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
            return !this.hasValue || (typeof this.default !== 'undefined' && this.default == this.value); // Don't do ===, otherwise empty objects are not recognized as the same.
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
            return (!this.output && this.state.root.supports('editParameters') && this.schemas.isEditable());
        },
        allowsMultipleInputs() {
            // Is there any type that potentially allows multiple inputs?
            return this.isArrayType || this.isObjectType || this.schemas.nativeDataType() === 'any';
        },
    },
    watch: {
        edges() {
            this.updateEdgeStatus();
            this.$emit('edgesChanged', this.edges, this);
        },
        value: {
            immediate: true,
            handler() {
                this.updateEdgeStatus();
            }
        }
    },
    methods: {
        updateEdgeStatus() {
            if (!this.output) {
                for(var edge of this.edges) {
                    edge.inactive = !this.isEdgeUsed(edge);
                }
            }
        },
        getCirclePosition() {
            var dim = Utils.domBoundingBox(this.$refs.circle);
            var blocksDim = this.state.root.getDimensions();
            var x = (dim.offsetLeft-blocksDim.offsetLeft)+dim.width/2;
            var y = (dim.offsetTop-blocksDim.offsetTop)+dim.height/2;
            return [x, y];
        },
        openEditorForParameter() {
            if (this.allowsParameterChange) {
                this.$parent.showParameters(this.name);
            }
        },
        jsonSchema() {
            return this.schemas.toJSON();
        },
        setValue(value) {
            if (this.schemas.nativeDataType() == 'boolean0' && !Utils.isRef(value)) {
                value = !!value;
            }
            this.$emit('input', value);
        },
        resetValue() {
            if (typeof this.default !== 'undefined') {
                this.setValue(this.default);
                return;
            }
            
            var value;
            if (this.schemas.nullable()) {
                value = null;
            }
            else {
                var dataType = this.schemas.nativeDataType();
                switch(dataType) {
                    case 'object':
                        value = {};
                        break;
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
                        value = undefined;
                }
            }
            this.setValue(value);
        },
        getEdgeRef(edge) {
            if (this.output) {
                return this.value;
            }
            else {
                return edge.parameter1.value;
            }
        },
        addRefToValue(edge) {
            var ref = this.getEdgeRef(edge);
            if (!ref) {
                return;
            }
            else if (!this.allowsMultipleInputs) {
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
            else if (this.isObjectType) {
                var propertyCount = Utils.size(this.value);
                if (this.getEdgeCount() === 1 && (!this.hasValue || !propertyCount)) {
                    this.setValue(ref);
                }
                else if (!propertyCount) {
                    this.resetValue();
                }
                else {
                    // Don't change value
                }
            }
            else {
                // ToDo: This is probably of data type mixed or any, how to handle?
                this.setValue(ref);
            }
        },
        removeRefFromValue(edge) {
            // ToDo: Check whether this should only be executed for input fields
            var ref = this.getEdgeRef(edge);
            if (Utils.isRefEqual(ref, this.value)) {
                this.resetValue();
            }
            else if (this.isArrayType || this.isObjectType) {
                this.setValue(this.removeRefFromValueDeep(this.value, ref));
            }
        },
        removeRefFromValueDeep(value, ref) {
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
                        value[i] = this.removeRefFromValueDeep(value[i], ref);
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
                        value[i] = this.removeRefFromValueDeep(value[key], ref);
                    }
                }
            }
            return value;
        },
        addEdge(edge) {
            this.edges.push(edge);
            if (!this.isEdgeUsed(edge) && !this.output) {
                this.addRefToValue(edge);
            }
        },
        eraseEdge(edge) {
            for (var k in this.edges) {
                if (this.edges[k] == edge) {
                    this.removeRefFromValue(edge);
                    this.$delete(this.edges, k);
                    return true;
                }
            }
            return false;
        },
        isEdgeUsed(edge) {
            var ref = this.getEdgeRef(edge);
            if (Utils.isRefEqual(ref, this.value)) {
                return true;
            }
            return this.hasRefInValue(ref, this.value);
        },
        hasRefInValue(ref, value) {
            if (!value || typeof value !== 'object') {
                return false;
            }
            else if (Utils.isRefEqual(ref, value)) {
                return true;
            }
            for(let key in value) {
                if (this.hasRefInValue(ref, value[key])) {
                    return true;
                }
            }
            return false;
        },
        getEdgeCount() {
            return this.edges.length;
        },
        formatProcess(pg) {
            // ToDO: Earlier this was always a ProcessGraph Object, but that seems no longer to be the case. How to clean-up?
            if (pg instanceof ProcessGraph && pg.getNodeCount() === 1) {
                return Utils.htmlentities(pg.getResultNode().process_id);
            }
            var nodes = Object.values(pg.process_graph);
            if (nodes.length === 1) {
                return Utils.htmlentities(nodes[0].process_id);
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
                    var text = Utils.htmlentities(value.substr(0, maxLength)) + '…';
                    formattedValue = html ? '<span title="' + Utils.htmlentities(value) + '">' + text + '…</span>' : text;
                }
                else {
                    formattedValue = Utils.htmlentities(value);
                }
            }
            else if (typeof value === 'boolean') {
                formattedValue = value ? '✔️' : '❌';
            }
            else if (typeof value === 'number') {
                formattedValue = value.toString();
            }
            else {
                formattedValue = Utils.htmlentities(JSON.stringify(value));
            }
            return formattedValue;
        },
        formatArray(value, maxLength, html = true) {
            var formatted = value.map(v => this.formatValue(v, 25, false)).join(", ");
            var unformatted = Utils.htmlentities_decode(formatted);
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
            // ToDO: Earlier this was always a ProcessGraph Object, but that seems no longer to be the case. How to clean-up?
            else if (value instanceof ProcessGraph || Utils.isObject(value.process_graph)) {
                return this.formatProcess(value);
            }
            else if (Utils.isRef(value)) {
                return Utils.formatRef(value);
            }
            else if (typeof value.west !== 'undefined' && typeof value.east !== 'undefined' && typeof value.south !== 'undefined' && typeof value.north !== 'undefined') {
                return 'Bounding Box';
            }
            else if (Utils.detectGeoJson(value)) {
                return value.type;
            }

            // Fallback to default
            return html ? '<span title="' + Utils.htmlentities(JSON.stringify(value)) + '">Object</span>' : 'Object';
        }
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
.unspecified {
    color: red;
    margin-left: 2px;
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