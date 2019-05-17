<template>
	<Modal ref="__modal">
		<template v-slot:main>
			<p v-if="editables.length === 0">No editable parameters available.</p>
			<form v-else id="parameterModal" @submit.prevent="save">
				<div class="fieldRow" v-for="(editable, k) in editables" :key="k">
					<label>
						{{ editable.label }}<strong class="required" v-if="editable.isRequired()" title="required">*</strong>
						<div v-if="editable.description()" class="description">
							<Description :description="editable.description()" />
						</div>
					</label>
					<ParameterFields :ref="editable.name" :field="editable" :pass="editable.getValue()" />
				</div>
			</form>
		</template>
		<template v-slot:footer>
			<div class="footer">
				<button class="save" @click="save">Save</button>
			</div>
		</template>
	</Modal>
</template>

<script>
import Utils from '../utils';
import Modal from './Modal.vue';
import Description from '@openeo/vue-components/components/Description.vue';
import ParameterFields from './ParameterFields.vue';

export default {
	name: 'ParameterModal',
	components: {
		Modal,
		Description,
		ParameterFields
	},
	data() {
		return {
			editables: [],
			saveCallback: null
		};
	},
	methods: {
		save() {
			try {
				var data = {};
				for(var i in this.$refs) {
					if (Array.isArray(this.$refs[i]) && this.$refs[i].length > 0 && Utils.isObject(this.$refs[i][0]) && typeof this.$refs[i][0].getValue == 'function') {
						data[i] = this.$refs[i][0].getValue();
					}
				}
				this.saveCallback(data);
				this.$refs.__modal.close();
			} catch (error) {
				Utils.exception(this, error);
			}
		},
		show(title, editables, saveCallback, closeCallback) {
			this.editables = editables;
			this.saveCallback = saveCallback;
			this.$refs.__modal.show(title, closeCallback);
		}
	}
};
</script>

<style scoped>
.description {
	font-size: 0.8em;
	width: 100%;
}
.required {
	color: red;
	font-weight: bold;
}
.footer {
	text-align: right;
}
</style>

<style>
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
#parameterModal .fieldRow label {
	min-width: 40%;
	width: 40%;
}
#parameterModal .fieldRow .fieldEditorContainer {
	flex-grow: 1;
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

#parameterModal .description .styled-description {
	line-height: 1.1em;
}
#parameterModal .description .styled-description p {
	margin: 0.2em 0;
}
</style>