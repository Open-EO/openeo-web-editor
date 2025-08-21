<template>
	<div class="parameters">
		<div class="fieldRow" v-for="(param, k) in parameters" v-show="toggleParamVisibility(param)" :key="k">
			<label :class="{ fieldLabel: true, highlight: param.name === selectParameter, info: param.info }">
				{{ displayLabel(param) }}
				<strong class="required" v-if="!param.info && !param.optional" title="required">*</strong>
				<div v-if="param.description" class="description">
					<Description :description="param.description" />
				</div>
			</label>
			<ParameterDataTypes v-if="!param.info" :ref="param.name" :editable="editable" :parameter="param" v-model="value[param.name]" :context="context" @schemaSelected="updateType(param, $event)" :parent="parent" />
			<button v-if="!param.info && param.unspecified" title="Delete unspecified parameter" class="deleteBtn" type="button" @click="deleteParam(k)"><i class="fas fa-trash"></i></button>
		</div>
	</div>
</template>

<script>
import Utils from '../utils';
import Description from '@openeo/vue-components/components/Description.vue';
import ParameterDataTypes from './ParameterDataTypes.vue';

export default {
	name: 'Parameters',
	components: {
		Description,
		ParameterDataTypes
	},
	props: {
		parameters: {
			type: Array,
			required: true
		},
		value: {
			type: Object,
			required: true
		},
		editable: {
			type: Boolean,
			default: true
		},
		selectParameter: {
			type: String,
			default: null
		},
		parent: {
			type: Object,
			default: null
		}
	},
	data() {
		return {
			show: true,
			schemas: {}
		};
	},
	computed: {
		context() {
			return {
				values: this.value,
				schemas: this.schemas,
				parameters: this.parameters
			};
		}
	},
	watch: {
		value: {
			deep: true,
			handler() {
				this.$emit('input', this.value);
			}
		}
	},
	mounted() {
		this.$nextTick(() => this.setSelected());
	},
	methods: {
		toggleParamVisibility(param) {
			if (!param || !param.toggledBy) {
				return true;
			}

			return !!this.value[param.toggledBy];
		},
		deleteParam(key) {
			let name = this.parameters[key].name;
			this.$delete(this.parameters, key);
			this.$delete(this.schemas, name);
			this.$delete(this.value, name);
		},
		updateType(parameter, schema) {
			this.$set(this.schemas, parameter.name, schema);
		},
		displayLabel(param) {
			if (typeof param.label === 'string' && param.label.length > 0) {
				return param.label;
			}
			else {
				return Utils.prettifyString(param.name);
			}
		},
		componentforParameter(name) {
			if (name && Array.isArray(this.$refs[name]) && this.$refs[name][0]) {
				return this.$refs[name][0];
			}
			return null;
		},
		setSelected(callCounter = 0) {
			let component;
			if (this.selectParameter) {
				component = this.componentforParameter(this.selectParameter);
			}
			else if (this.parameters.length > 0) {
				component = this.componentforParameter(this.parameters[0].name);
			}
			if (!component) {
				return;
			}
	
			if (component.$el && component.$el.scrollIntoView) {
				if (this.selectParameter) {
					component.$el.scrollIntoView();
				}
				this.setInputFocus(component.$el);
			}
			else {
				// Retry the selection, up to 2.5 seconds
				callCounter < 10 && setTimeout(() => this.setSelected(++callCounter), 250);
			}
		},
		setInputFocus(node, callCounter = 0) {
			if (node.querySelector) {
				let firstElement = node.querySelector('input:not([type="hidden"]):not([disabled]):not([class~="multiselect__input"]), button:not([disabled]), textarea:not([disabled]), select:not([disabled]), datalist:not([disabled])');
				if (firstElement) {
					firstElement.focus();
				}
			}
			else {
				// Retry focussing, up to 2.5 seconds
				callCounter < 10 && setTimeout(() => this.setInputFocus(node, ++callCounter), 250);
			}
		}
	}
};
</script>

<style lang="scss" scoped>
.deleteBtn {
	margin-left: 10px;
}
</style>

<style lang="scss">
@use '../../theme' as *;

.parameters {
	.fieldRow {
		display: flex;
		padding-top: 1em;
		margin-top: 1em;
		border-top: 1px dotted #ccc;

		&:first-of-type {
			border: 0;
			margin: 0;
			padding: 0;
		}

		.description {
			font-size: 0.8em;
			width: 100%;
		}
		.required {
			color: red;
			font-weight: bold;
		}
		.fieldLabel {
			min-width: 30%;
			width: 30%;
			padding-right: 1em;

			&.highlight {
				width: calc(35% - 5px);
				border-left: 5px solid $linkColor;
				padding-left: 5px;
			}
			&.info {
				width: 100%;
			}
		}
		.fieldEditorContainer {
			flex-grow: 1;
			display: flex;
		}
		.fieldContainer {
			min-width: 50%;
			width: 70%;
			flex-grow: 1;
		}
		.fieldValue {
			display: flex;
			flex-grow: 1;

			input,
			textarea,
			select {
				flex-grow: 1;
				width: 100%;
			}
		}
		
		input[type="checkbox"].fieldValue  {
			display: inline-block;
			flex-grow: unset;
		}
	}

	.description .styled-description {
		line-height: 1.1em;

		p {
			margin: 0.2em 0;
		}
	}
}
</style>