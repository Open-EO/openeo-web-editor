<template>
	<div class="fieldContainer" v-if="selectedType !== null">
		<div class="dataTypeChooser" v-if="allowedSchemas.length > 1">
			<select name="dataType" v-model="selectedType" :disabled="!editable">
				<option v-for="(schema, type) in allowedSchemas" :key="type" :value="type">{{ schema.title() }}</option>
			</select>
		</div>
		<div v-if="allowedSchemas[selectedType].description()" class="description">
			<i class="fas fa-info-circle"></i> {{ allowedSchemas[selectedType].description() }}
		</div>
		<ParameterField ref="field" :uid="uid" :editable="editable" :field="field" :schema="selectedSchema" :pass="pass" :processId="processId" :isObjectItem="isObjectItem" />
	</div>
</template>

<script>
import Utils from '../utils.js';
import ParameterField from './ParameterField.vue';
import Field from './blocks/field.js';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import { JsonSchemaValidator } from '@openeo/js-commons';
import { ProcessSchema, ProcessSubSchema } from '../processSchema.js';

const SUPPORTED_TYPES = new ProcessSchema({
	anyOf: [
		{type: 'null'},
		{type: 'string'},
		{type: 'number'},
		{type: 'integer'},
		{type: 'boolean'},
		{type: 'array'},
		{type: 'object'},
		{type: 'string', format: 'band-name'},
		{type: 'object', format: 'bounding-box'},
		{type: 'object', format: 'callback'},
		{type: 'string', format: 'collection-id'},
		{type: 'string', format: 'date'},
		{type: 'string', format: 'date-time'},
		{type: 'integer', format: 'epsg-code'},
		{type: 'object', format: 'geojson'},
		{type: 'string', format: 'job-id'},
	//	{type: 'array', format: 'kernel'},
		{type: 'string', format: 'output-format'},
		{type: 'string', format: 'process-graph-id'},
		{type: 'string', format: 'proj-definition'},
		{type: 'array', format: 'temporal-interval'},
		{type: 'array', format: 'temporal-intervals'},
		{type: 'string', format: 'time'}
	]
});

export default {
	name: 'ParameterFields',
	mixins: [EventBusMixin],
	components: {
		ParameterField
	},
	props: {
		field: Object,
		editable: {
			type: Boolean,
			default: true
		},
		processId: String,
		pass: {},
		uid: String,
		useAny: {
			type: Boolean,
			default: false
		},
		isObjectItem: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			selectedType: null
		};
	},
	created() {
		if (this.allowedSchemas.length > 1) {
			JsonSchemaValidator.getTypeForValue(this.allowedSchemas.map(s => s.schema), this.pass)
				.then(evalType => {
					if (typeof evalType === 'undefined') {
						this.guessType();
					}
					else if (Array.isArray(evalType)) {
						if (!Field.isRef(this.pass)) {
							if (!this.isObjectItem) {
								Utils.info(this, "Data type can't be detected, please select it yourself.");
							}
							console.warn("Parameter schema is ambiguous. Potential types: " + evalType.join(', ') + ". Value: " + JSON.stringify(this.pass));
						}
						this.setSelectedType(evalType[0]);
					}
					else {
						this.setSelectedType(evalType);
					}
				})
				.catch(error => {
					console.warn(error);
					this.guessType()
				});
		}
		else {
			this.setSelectedType(0);
		}
	},
	computed: {
		allowedSchemas() {
			var schemas = [].concat(
				this.refs.from_node.map(n => new ProcessSubSchema({
					type: 'object',
					isRef: 'from_node',
					from_node: n,
					title: 'Output of #' + n,
					required: ["from_node"],
					properties: {
						from_node: {
							type: "string",
							const: n
						}
					},
					additionalProperties: false
				})),
				this.refs.from_argument.map(a => new ProcessSubSchema({
					type: 'object',
					isRef: 'from_argument',
					from_argument: a,
					title: 'Value of callback argument "' + a + '"',
					required: ["from_argument"],
					properties: {
						from_argument: {
							type: "string",
							const: a
						}
					},
					additionalProperties: false
				})),
			);
			var type = this.field.dataType();
			if (type === 'any' || this.useAny) {
				return schemas.concat(SUPPORTED_TYPES.schemas);
			}
			else {
				return schemas.concat(this.field.schemas);
			}
		},
		selectedSchema() {
			return this.allowedSchemas[this.selectedType];
		},
		refs() {
			return this.field.getRefs();
		}
	},
	watch: {
		type(newType, oldType) {
			if (this.uid) {
				this.emit('processParameterTypeChanged', this.uid, this.processId, this.field, newType, oldType);
			}
		}
	},
	methods: {
		setSelectedType(type) {
			this.selectedType = String(type);
		},
		guessType() {
			// Try to set null as default
			for(var i in this.field.schemas) {
				if (this.field.schemas[i].isNull()) {
					this.setSelectedType(i);
					return;
				}
			}
			// Otherwise set first type in list
			this.setSelectedType(0);
		},
		getValue() {
			return this.$refs.field.getValue();
		}
	}
};
</script>

<style scoped>
.description {
	font-size: 0.9em;
	margin-bottom: 10px;
}
.dataTypeChooser {
	margin-bottom: 10px;
}
</style>
