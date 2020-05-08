<template>
	<Modal ref="__modal" minWidth="60%" maxWidth="90%">
		<template #main>
			<p v-if="editableFields.length === 0">No editable parameters available.</p>
			<form v-else id="parameterModal" @submit.prevent="save">
				<div class="fieldRow" v-for="(param, k) in editableFields" :key="k">
					<label :class="{ fieldLabel: true, highlight: param.name === selectFieldName }">
						{{ displayLabel(param) }}<strong class="required" v-if="!param.optional" title="required">*</strong>
						<div v-if="param.description" class="description">
							<Description :description="param.description" />
						</div>
					</label>
					<ParameterDataTypes :uid="uid" :ref="param.name" :editable="editable" :spec="param" :pass="values[param.name]" :processId="processId" />
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
import { Utils as VueUtils } from '@openeo/vue-components';

export default {
	name: 'ParameterModal',
	components: {
		Modal,
		Description,
		ParameterDataTypes
	},
	data() {
		return {
			uid: '_' + Utils.getUniqueId(),
			editableFields: [],
			values: {},
			editable: true,
			selectFieldName: null,
			saveCallback: null,
			processId: null
		};
	},
	methods: {
		displayLabel(param) {
			if (typeof param.label === 'string' && param.label.length > 0) {
                return param.label;
            }
            else {
                return VueUtils.prettifyString(param.name);
            }
		},
		save() {
			try {
				if (typeof this.saveCallback === 'function') {
					var data = {};
					for(var i in this.$refs) {
						if (Array.isArray(this.$refs[i]) && this.$refs[i].length > 0 && Utils.isObject(this.$refs[i][0]) && typeof this.$refs[i][0].getValue == 'function') {
							data[i] = this.$refs[i][0].getValue();
						}
					}
					this.saveCallback(data);
				}
				this.$refs.__modal.close();
			} catch (error) {
				Utils.exception(this, error);
			}
		},
		show(title, editableFields, values, editable = true, saveCallback = null, closeCallback = null, processId = null, selectFieldName = null) {
			this.editableFields = editableFields;
			this.values = values;
			this.editable = editable;
			this.saveCallback = saveCallback;
			this.processId = processId;
			this.selectFieldName = selectFieldName;
			this.$refs.__modal.show(title, closeCallback);

			// ToDo: It's a bit hacky to have a fixed timeout set to allow the element to be available for scrolling => improve?!
			setTimeout(() => {
				if (this.selectFieldName && Array.isArray(this.$refs[this.selectFieldName]) && this.$refs[this.selectFieldName][0]) {
					this.$refs[this.selectFieldName][0].$el.scrollIntoView();
				}
			}, 100);
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
	flex-grow: 1;
	padding-left: 1em;
}
#parameterModal .fieldRow .fieldValue {
	display: flex;
	flex-grow: 1;
}
#parameterModal .fieldRow .fieldValue input, .fieldRow .fieldValue textarea, .fieldRow .fieldValue select {
	flex-grow: 1;
	width: 99%;
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