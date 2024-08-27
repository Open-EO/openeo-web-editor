<template>
	<div :class="{editor: true, array: !isObject, object: isObject}">
		<div class="buttons">
			<button type="button" class="addBtn" v-if="editable && canAdd" :disabled="count >= maxCount" @click="add()"><i class="fas fa-plus"></i> Add</button>
			<FullscreenButton :element="() => this.$el" />
		</div>
		<div v-if="!elements.length" class="empty description">
			<i class="fas fa-info-circle"></i>
			<template v-if="isObject">&nbsp;Object is empty</template>
			<template v-else>&nbsp;Array is empty</template>
		</div>
		<draggable v-else v-model="elements" handle=".mover">
			<div class="fieldValue element" v-for="(e, k) in elements" :key="e.id">
				<div class="row">
					<label class="fieldLabel">
						<template v-if="isObject && (e.prop.title || e.prop.required)">{{ e.prop.title || e.key }}</template>
						<input v-else-if="isObject" v-model="e.key" type="text" :disabled="!editable"/>
						<template v-else>{{ k+1 }}</template>
					</label>
					<ParameterDataTypes :editable="editable" :parameter="elementSchema(k, e.key)" :isItem="true" :parent="parent" :context="context" v-model="e.value" />
					<button v-if="editable && !e.prop.required" :disabled="count <= minCount" class="deleteBtn" type="button" @click="remove(k)"><i class="fas fa-trash"></i></button>
					<button v-show="editable && !isObject" class="mover" type="button"><i class="fas fa-arrows-alt"></i></button>
				</div>
				<div class="row" v-if="e.prop.description">
					<div class="description">
						<i class="fas fa-info-circle"></i>
						<Description :description="e.prop.description" :compact="true" />
					</div>
				</div>
			</div>
		</draggable>
	</div>
</template>

<script>
import draggable from 'vuedraggable';
import Description from '@openeo/vue-components/components/Description.vue';
import FullscreenButton from '../FullscreenButton.vue';
import { ProcessUtils, ProcessSchema } from '@openeo/js-commons';
import Utils from '../../utils';

export default {
	name: 'ObjectEditorDnD',
	components: {
		draggable,
		Description,
		FullscreenButton,
		ParameterDataTypes: () => import('../ParameterDataTypes.vue')
	},
	props: {
		parameter: Object,
		editable: {
			type: Boolean,
			default: true
		},
		schema: Object,
		value: {},
		isObject: {
			type: Boolean,
			default: false
		},
		parent: Object,
		context: {}
	},
	data() {
		return {
			elements: []
		};
	},
	computed: {
		count() {
			return Utils.size(this.elements);
		},
		maxCount() {
			return (this.isObject ? this.schema.schema.maxProperties : this.schema.schema.maxItems) || Number.MAX_VALUE;
		},
		minCount() {
			return (this.isObject ? this.schema.schema.minProperties : this.schema.schema.minItems) || 0;
		},
		canAdd() {
			return !this.isObject || this.schema.schema.additionalProperties !== false;
		},
		prefill() {
			let schema = this.schema.schema;
			if (this.isObject && Utils.isObject(schema.properties)) {
				let arr = [];
				for (let name in schema.properties) {
					const propSchema = schema.properties[name];
					if (propSchema.not) {
						continue;
					}
					let required = false;
					if (Array.isArray(schema.required) && schema.required.includes(name)) {
						required = true;
					}
					arr.push(Object.assign({name, required}, propSchema));
				}
				return arr;
			}
			else if (!this.isObject && this.minCount > 0) {
				return [...Array(this.minCount).keys()].map(key => ({
					name: key
				}));
			}
			return [];
		},
		newValue() {
			if (this.isObject) {
				let obj = {};
				for(let e of this.elements) {
					obj[e.key] = e.value;
				}
				return obj;
			}
			else {
				return this.elements.map(v => v.value);
			}
		}
	},
	watch: {
		newValue: {
			deep: true,
			handler(newValue) {
				this.$emit('input', newValue);
			}
		},
		value: {
			immediate: true,
			handler(value) {
				if (this.newValue !== value) {
					this.elements = [];
					
					// Prefill if empty
					if (Utils.size(value) === 0 && this.prefill.length > 0) {
						for(let prop of this.prefill) {
							this.add(prop.name, undefined, prop);
						}
					}
					// Convert to internal state object
					else if (value && typeof value === 'object') {
						for(let key in value) {
							this.add(key, value[key]);
						}
					}
				}
			}
		}
	},
	methods: {
		elementSchema(index, key = null) {
			let element = ProcessUtils.getElementJsonSchema(this.schema.schema, key || index);
			let schema = new ProcessSchema(element);
			if (this.schema.parent instanceof ProcessSchema) {
				schema.refs = this.schema.parent.refs || [];
			}
			return schema;
		},
		add(key = null, value = undefined, prop = {}) {
			let obj = {
				id: String(this.elements.length),
				value: value
			};
			if (this.isObject) {
				obj.key = key ? key : "unnamed" + this.elements.length;
			}
			obj.prop = prop;
			if (typeof obj.value === 'undefined') {
				if (typeof prop.default !== 'undefined') {
					obj.value = prop.default;
				}
				else {
					obj.value = this.elementSchema(this.elements.length, obj.key).default;
				}
			}
			this.elements.push(obj);
		},
		remove(k) {
			this.elements.splice(k, 1);
		}
	}
};
</script>

<style scoped>
.editor, .editor > div {
	width: 100%;
	box-sizing: border-box;
	padding: 0.25em;
}
.element {
	border: 1px solid #ccc;
	border-radius: 3px;
	padding: 0.4em 0.25em;
	margin: 0.4em 0.25em;
}
.array .element.sortable-chosen {
	background: #eee;
}
.array .element.sortable-chosen .deleteBtn {
	visibility: hidden;
}
.parameters .fieldRow .array .element .fieldLabel {
	display: flex;
	align-items: center;
	min-width: 1.5em;
	width: auto;
	padding: 0 0.5em;
}
.parameters .fieldRow .object .element .fieldLabel {
	min-width: 20%;
}
.parameters .fieldRow .element .fieldValue {
	display: block;
}
.element > .row {
	width: 100%;
	display: flex;
	align-items: stretch;
}
.element > .row > .description {
	padding: 0 0.5em;
	margin-top: 0.5em;
	margin-bottom: 0;
}
.array .deleteBtn {
	margin: 0 0.5em 0 1em;
}
.object .deleteBtn {
	margin-left: 10px;
}
.addBtn {
	margin: 0 0.25em;
}
.empty.description {
	padding: 0.5em 0.25em;
}
.fullscreen {
	padding: 1em;
	box-sizing: border-box;
}
.mover {
	cursor: pointer;
	border: 0;
	background-color: transparent;
}
</style>
