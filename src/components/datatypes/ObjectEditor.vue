<template>
	<div :class="{editor: true, array: !isObject, object: isObject}">
		<div class="buttons">
			<button type="button" class="addBtn" v-if="editable" @click="add()"><i class="fas fa-plus"></i> Add</button>
			<FullscreenButton :element="() => this.$el" />
		</div>
		<div v-if="!elements.length" class="empty description">
			<i class="fas fa-info-circle"></i>
			<template v-if="isObject">&nbsp;Object is empty</template>
			<template v-else>&nbsp;Array is empty</template>
		</div>
		<draggable v-else v-model="elements" handle=".mover">
			<div class="fieldValue element" v-for="(e, k) in elements" :key="e.id">
				<label class="fieldLabel" :key="k">
					<input v-if="isObject" v-model="e.key" type="text" :disabled="!editable"/>
					<template v-else>{{ k }}</template>
				</label>
				<ParameterDataTypes :editable="editable" :spec="schema.getElementSchema(e.key || k)" :isItem="true" v-model="e.value" />
				<button v-if="editable" class="deleteBtn" type="button" @click="remove(k)"><i class="fas fa-trash"></i></button>
				<button v-show="editable && !isObject" class="mover" type="button"><i class="fas fa-arrows-alt"></i></button>
			</div>
		</draggable>
	</div>
</template>

<script>
import draggable from 'vuedraggable';
import FullscreenButton from '../FullscreenButton.vue';
import Utils from '../../utils.js';

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
		}
	},
	data() {
		return {
			elements: []
		};
	},
	computed: {
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
				// ToDo: Pre-fill if empty, e.g. set minimum number of array elements or required object properties
				if (this.newValue !== value) {
					this.elements = [];
					if (value && typeof value === 'object') {
						for(var key in value) {
							this.addElem(value[key], key);
						}
					}
				}
			}
		}
	},
	methods: {
		addElem(value, key) {
			let obj = {
				id: String(key),
				value: value
			};
			if (this.isObject) {
				obj.key = key;
			}
			this.elements.push(obj);
		},
		add() {
			var defaultValue = null;
			var itemType = this.schema.getElementSchema().nativeDataType();
			if (itemType === 'string') {
				defaultValue = "";
			}
			else if (itemType === 'number' || itemType === 'integer') {
				defaultValue = 0;
			}
			else if (itemType === 'boolean') {
				defaultValue = false;
			}
			else if (itemType === 'array') {
				defaultValue = [];
			}
			else if (itemType === 'object') {
				defaultValue = {};
			}

			this.addElem(defaultValue, "unnamed" + this.elements.length);
			return false;
		},
		remove(k) {
			this.elements.splice(k, 1);
			return false;
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
