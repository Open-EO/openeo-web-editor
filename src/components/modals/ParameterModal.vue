<template>
	<Modal :show="show" minWidth="60%" width="90%" :title="title" @closed="$emit('closed')">
		<template #default>
			<p v-if="parameters.length === 0">No editable parameters available.</p>
			<form v-else id="parameterModal" @submit.prevent="save">
				<div class="fieldRow" v-for="(param, k) in parameters" v-show="toggleParamVisibility(param)" :key="k">
					<label :class="{ fieldLabel: true, highlight: param.name === selectParameter, info: param.info }">
						{{ displayLabel(param) }}
						<strong class="required" v-if="!param.info && !param.optional" title="required">*</strong>
						<div v-if="param.description" class="description">
							<Description :description="param.description" />
						</div>
					</label>
					<ParameterDataTypes v-if="!param.info" :ref="param.name" :editable="editable" :parameter="param" v-model="values[param.name]" :context="context" @schemaSelected="updateType(param, $event)" :parent="parent" />
					<button v-if="!param.info && param.unspecified" title="Delete unspecified parameter" class="deleteBtn" type="button" @click="deleteParam(k)"><i class="fas fa-trash"></i></button>
				</div>
				<!-- We need a hidden submit button in the form tags to allow submiting the form via keyboard (enter key) -->
				<button type="submit" style="display:none"></button>
			</form>
		</template>
		<template v-if="$listeners.save" #footer>
			<div class="footer">
				<button class="save" @click="save">Save</button>
			</div>
		</template>
	</Modal>
</template>

<script>
import Utils from '../../utils';
import Modal from './Modal.vue';
import Description from '@openeo/vue-components/components/Description.vue';
import ParameterDataTypes from '../ParameterDataTypes.vue';

export default {
	name: 'ParameterModal',
	components: {
		Modal,
		Description,
		ParameterDataTypes
	},
	props: {
		title: {
			type: String
		},
		parameters: {
			type: Array
		},
		data: {
			type: Object
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
			values: Utils.deepClone(this.data),
			schemas: {}
		};
	},
	computed: {
		context() {
			return {
				values: this.values,
				schemas: this.schemas,
				parameters: this.parameters
			};
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

			return !!this.context.values[param.toggledBy];
		},
		deleteParam(key) {
			let name = this.parameters[key].name;
			this.$delete(this.parameters, key);
			this.$delete(this.schemas, name);
			this.$delete(this.values, name);
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
		save() {
			try {
				this.$emit('save', this.values);
				this.show = false;
			} catch (error) {
				Utils.exception(this, error);
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
.footer {
	text-align: right;
}
.deleteBtn {
	margin-left: 10px;
}
</style>

<style lang="scss">
@import '../../../theme.scss';

#parameterModal {
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