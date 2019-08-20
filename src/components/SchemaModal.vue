<template>
	<Modal ref="modal">
		<template #main>
			<div id="schemaModal">
				<p class="message" v-if="message">{{ message }}</p>
				<JsonSchema :schema="schema"></JsonSchema>
			</div>
		</template>
	</Modal>
</template>

<script>
import Modal from './Modal.vue';
import JsonSchema from '@openeo/vue-components/components/JsonSchema.vue';

export default {
	name: 'SchemaModal',
	components: {
		Modal,
		JsonSchema
	},
	data() {
		return {
			schema: null,
			message: null
		};
	},
	methods: {
		show(title, schema, message = null) {
			this.schema = schema;
			this.message = message;
			this.$refs.modal.show(title);
		}
	}
}
</script>

<style>
#schemaModal p.message {
	margin-top: 0;
}
#schemaModal .json-schema {
	border: 0;
}
</style>