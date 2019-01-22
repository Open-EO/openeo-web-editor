<template>
	<div>
		<p v-if="this.editables.length === 0">No editable parameters available.</p>
		<form v-else id="processParameterEditor" @submit.prevent="save">
			<div v-for="(editable, k) in editables" :key="k" v-html="editable.getFieldHtml()"></div>
			<button type="submit" class="save">Save</button>
		</form>
	</div>
</template>

<script>
export default {
    name: 'ProcessParameterEditor',
	props: ['editables', 'fields', 'saveCallback','handleArrays'],
	mounted() {
		this.handleArrays(this.form());
	},
    methods: {
		form() {
			return document.getElementById('processParameterEditor');
		},
		save() {
			return this.saveCallback(this.form());
		}
    }
};
</script>