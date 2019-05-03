<template>
	<div class="fieldContainer">
		<div class="dataTypeChooser" v-if="this.field.schemas.length > 1">
			Select data type:
			<select name="dataType" v-model="type">
				<option v-for="(schema, key) in this.field.schemas" :key="key" :value="key">{{ schema.title() }}</option>
			</select>
			<div v-if="this.field.schemas[type].description" class="description">
				<i class="fas fa-info-circle"></i> {{ this.field.schemas[type].description }}
			</div>
		</div>
		<EditorField :field="field" :schema="this.field.schemas[type]" :pass="pass" />
	</div>
</template>

<script>
import EditorField from './EditorField.vue';

export default {
	name: 'EditorFields',
	components: {
		EditorField
	},
	props: {
		field: Object,
		pass: {}
	},
	data() {
		return {
			type: 0
		};
	}
};
</script>

<style scoped>
.description {
	font-size: 0.9em;
	margin-top: 0.5em;
}
.dataTypeChooser {
	margin-bottom: 1em;
}
</style>
