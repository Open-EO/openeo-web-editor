<template>
	<Modal ref="__modal" minWidth="60%" maxWidth="90%" minHeight="75%">
		<template #main>
			<p v-if="editableFields.length === 0">No editable parameters available.</p>
			<form v-else id="parameterModal" @submit.prevent="save">
				<div class="fieldRow" v-for="(param, k) in editableFields" :key="k">
					<label :class="{ fieldLabel: true, highlight: param.name === selectParameter }">
						{{ displayLabel(param) }}<strong class="required" v-if="!param.optional" title="required">*</strong>
						<div v-if="param.description" class="description">
							<Description :description="param.description" />
						</div>
					</label>
					<ParameterDataTypes :ref="param.name" :editable="editable" :parameter="param" v-model="values[param.name]" :context="context" @schemaSelected="updateType(param, $event)" :parent="parent" />
					<button v-if="param.unspecified" title="Delete unspecified parameter" class="deleteBtn" type="button" @click="deleteParam(k)"><i class="fas fa-trash"></i></button>
				</div>
				<!-- We need a hidden submit button in the form tags to allow submiting the form via keyboard (enter key) -->
				<button type="submit" style="display:none"></button>
			</form>
		</template>
		<template v-if="typeof saveCallback === 'function'" #footer>
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
	data() {
		return {
			editableFields: [],
			values: {},
			schemas: {},
			editable: true,
			selectParameter: null,
			saveCallback: null,
			parent: null
		};
	},
	computed: {
		context() {
			return {
				values: this.values,
				schemas: this.schemas,
				parameters: this.editableFields
			};
		}
	},
	methods: {
		deleteParam(key) {
			let name = this.editableFields[key].name;
			this.$delete(this.editableFields, key);
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
				if (typeof this.saveCallback === 'function') {
					this.saveCallback(this.values);
				}
				this.$refs.__modal.close();
			} catch (error) {
				Utils.exception(this, error);
			}
		},
		show(title, editableFields, values, editable = true, saveCallback = null, closeCallback = null, selectParameter = null, parent = null) {
			this.editableFields = editableFields;
			this.values = Utils.deepClone(values);
			this.schemas = {};
			this.editable = editable;
			this.saveCallback = saveCallback;
			this.selectParameter = selectParameter;
			this.parent = parent;
			this.$refs.__modal.show(title, closeCallback);

			this.$nextTick(() => this.setSelected());
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
			else if (this.editableFields.length > 0) {
				component = this.componentforParameter(this.editableFields[0].name);
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

<style scoped>
.footer {
	text-align: right;
}
.deleteBtn {
	margin-left: 10px;
}
</style>

<style lang="scss">
@import '../../../theme.scss';

#parameterModal .fieldRow .description {
	font-size: 0.8em;
	width: 100%;
}
#parameterModal .fieldRow .required {
	color: red;
	font-weight: bold;
}
#parameterModal .fieldRow:first-of-type {
	border: 0;
	margin: 0;
	padding: 0;
}
#parameterModal .fieldRow {
	display: flex;
	padding-top: 1em;
	margin-top: 1em;
	border-top: 1px dotted #ccc;
}
#parameterModal .fieldRow .fieldLabel {
	min-width: 30%;
	width: 30%;
	padding-right: 1em;
}
#parameterModal .fieldRow .fieldLabel.highlight {
	width: calc(35% - 5px);
    border-left: 5px solid $linkColor;
    padding-left: 5px;
}
#parameterModal .fieldRow .fieldEditorContainer {
	flex-grow: 1;
	display: flex;
}
#parameterModal .fieldRow .fieldContainer {
	min-width: 50%;
	width: 70%;
	flex-grow: 1;
}
#parameterModal .fieldRow .fieldValue {
	display: flex;
	flex-grow: 1;
}
#parameterModal .fieldRow .fieldValue input, .fieldRow .fieldValue textarea, .fieldRow .fieldValue select {
	flex-grow: 1;
	width: 100%;
}
#parameterModal .fieldRow input[type="checkbox"].fieldValue  {
	display: inline-block;
	flex-grow: unset;
}

#parameterModal .description .styled-description {
	line-height: 1.1em;
}
#parameterModal .description .styled-description p {
	margin: 0.2em 0;
}
</style>