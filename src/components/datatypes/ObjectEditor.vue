<template>
	<div :class="{editor: true, array: !isObject, object: isObject}">
		<div class="buttons">
			<button type="button" class="addBtn" v-if="editable" :disabled="count >= maxCount" @click="add()"><i class="fas fa-plus"></i> Add</button>
			<FullscreenButton :element="() => this.$el" />
		</div>
		<div v-if="!elements.length" class="empty description">
			<i class="fas fa-info-circle"></i>
			<template v-if="isObject">&nbsp;Object is empty</template>
			<template v-else>&nbsp;Array is empty</template>
		</div>
		<draggable v-else v-model="elements" handle=".mover">
			<div class="fieldValue element" v-for="(e, k) in elements" :key="e.id">
				<label class="fieldLabel">
					<input v-if="isObject" v-model="e.key" type="text" :disabled="!editable"/>
					<template v-else>{{ k+1 }}</template>
				</label>
				<ParameterDataTypes :editable="editable" :parameter="elementSchema(k, e.key)" :isItem="true" :context="context" v-model="e.value" />
				<button v-if="editable" :disabled="count <= minCount" class="deleteBtn" type="button" @click="remove(k)"><i class="fas fa-trash"></i></button>
				<button v-show="editable && !isObject" class="mover" type="button"><i class="fas fa-arrows-alt"></i></button>
			</div>
		</draggable>
	</div>
</template>

<script>
import draggable from 'vuedraggable';
import FullscreenButton from '../FullscreenButton.vue';
import { ProcessUtils, ProcessSchema } from '@openeo/js-commons';
import Utils from '../../utils';

export default {
	name: 'ObjectEditor',
	components: {
		draggable,
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
		requiredKeys() {
			if (this.isObject && Array.isArray(this.schema.schema.required)) {
				return this.schema.schema.required;
			}
			else if (!this.isObject && this.minCount > 0) {
				return [...Array(this.minCount).keys()];
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
					if (Utils.size(value) === 0 && this.requiredKeys.length > 0) {
						for(let key of this.requiredKeys) {
							this.add(key, null);
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
		add(key = null, value = undefined) {
			let obj = {
				id: String(this.elements.length),
				value: value
			};
			if (this.isObject) {
				obj.key = key ? key : "unnamed" + this.elements.length;
			}
			if (typeof obj.value === 'undefined') {
				obj.value = this.elementSchema(this.elements.length, obj.key).default;
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
}
.element {
	display: flex;
	border: 1px solid #ccc;
	border-radius: 3px;
	padding: 0.4em 0.25em;
	margin: 0.4em 0.25em;
	align-items: stretch;
}
.array .element.sortable-chosen {
	background: #eee;
}
.array .element.sortable-chosen .deleteBtn {
	visibility: hidden;
}
#parameterModal .fieldRow .array .element .fieldLabel {
	display: flex;
	align-items: center;
	min-width: 1.5em;
	width: auto;
	padding: 0 0.5em;
}
.array .deleteBtn {
	margin: 0 0.5em 0 1em;
}
.object .deleteBtn {
	margin-left: 10px;
}
.addBtn {
	margin: 0.25em;
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
