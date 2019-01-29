<template>
	<div>
		<p v-if="this.editables.length === 0">No editable parameters available.</p>
		<form v-else id="processParameterEditor" @submit.prevent="save">
			<div class="fieldRow" v-for="(editable, k) in editables" :key="k">
				<label>
					{{ editable.label }}<strong class="required" v-if="editable.meta.required === true" title="required">*</strong>
					<div v-if="editable.meta.description" class="description">
						<Description :description="editable.meta.description" />
					</div>
				</label>
				<EditorField :ref="editable.name" :field="editable" :pass="editable.getValue()" />
			</div>
			<button type="submit" class="save">Save</button>
		</form>
	</div>
</template>

<script>
import Description from '@openeo/vue-components/components/Description.vue';
import EditorField from './EditorField.vue';

export default {
	name: 'ProcessParameterEditor',
	components: {
		Description,
		EditorField
	},
	props: ['editables', 'saveCallback'],
    methods: {
		save() {
			var data = {};
			for(var i in this.$refs) {
				data[i] = this.$refs[i][0].getValue();
			}
			return this.saveCallback(data);
		}
    }
};
</script>

<style scoped>
.description {
	font-size: 0.8em;
	max-height: 200px;
	width: 100%;
	overflow: auto;
}
.required {
	color: red;
	font-weight: bold;
}
</style>

<style>
#processParameterEditor .fieldRow {
	display: flex;
	padding-bottom: 0.5em;
	margin-bottom: 0.5em;
	border-bottom: 1px dotted #ccc;
}
#processParameterEditor .fieldRow label {
	width: 40%;
}
#processParameterEditor .fieldRow .fieldContainer {
	flex-grow: 1;
}
#processParameterEditor .fieldRow .fieldValue {
	display: flex;
	flex-grow: 1;
}
#processParameterEditor .fieldRow .fieldValue input, .fieldRow .fieldValue textarea, .fieldRow .fieldValue select {
	flex-grow: 1;
	width: 99%;
}

#processParameterEditor .description .styled-description {
	line-height: 1.1em;
}
#processParameterEditor .description .styled-description p {
	margin: 0.2em 0;
}
</style>