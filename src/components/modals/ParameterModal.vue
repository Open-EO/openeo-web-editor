<template>
	<Modal ref="__modal" minWidth="60%" maxWidth="90%">
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
					<ParameterDataTypes :ref="param.name" :editable="editable" :spec="param" v-model="values[param.name]" :processId="processId" :context="context" @schemaSelected="updateType(param, $event)" />
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
			processId: null
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
		updateType(parameter, schema) {
			this.schemas[parameter.name] = schema;
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
		show(title, editableFields, values, editable = true, saveCallback = null, closeCallback = null, processId = null, selectParameter = null) {
			this.editableFields = editableFields;
			this.values = Utils.deepClone(values);
			this.editable = editable;
			this.saveCallback = saveCallback;
			this.processId = processId;
			this.selectParameter = selectParameter;
			this.$refs.__modal.show(title, closeCallback);

			// ToDo: It's a bit hacky to have a fixed timeout set to allow the element to be available for scrolling => improve?!
			setTimeout(() => {
				let component = this.componentforParameter(this.selectParameter);
				if (component) {
					component.$el.scrollIntoView();
				}
			}, 100);
		},
		componentforParameter(name) {
			if (this.selectParameter && Array.isArray(this.$refs[this.selectParameter]) && this.$refs[this.selectParameter][0]) {
				return this.$refs[this.selectParameter][0];
			}
			return null;
		}
	}
};
</script>

<style scoped>
.footer {
	text-align: right;
}
</style>

<style>
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
    border-left: 5px solid #1665B6;
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