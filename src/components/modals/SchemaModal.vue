<template>
	<Modal :title="name" @closed="$emit('closed')">
		<div id="schemaModal">
			<p class="message" v-if="message">{{ message }}</p>
			<JsonSchema :schema="schema" />
		</div>
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
	props: {
		name: {
			type: String
		},
		message: {
			type: String,
			default: null
		},
		schema: {
			default: null,
		}
	}
}
</script>

<style lang="scss">
#schemaModal {
	p.message {
		margin-top: 0;
	}
	.json-schema {
		border: 0;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.95em;

		td,
		th {
			border: 1px solid #ddd;
			padding: 3px;
		}
	}
}
</style>