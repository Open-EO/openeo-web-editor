<template>
	<Modal :show="show" minWidth="60%" width="90%" :title="title" @closed="$emit('closed')" :submitFunction="submitFunction">
		<template #default>
			<p v-if="parameters.length === 0">No editable parameters available.</p>
			<Parameters v-else v-model="values" :parameters="parameters" :editable="editable" :selectParameter="selectParameter" :parent="parent" />
		</template>
	</Modal>
</template>

<script>
import Utils from '../../utils';
import Modal from './Modal.vue';
import Parameters from '../Parameters.vue';

export default {
	name: 'ParameterModal',
	components: {
		Modal,
		Parameters
	},
	props: {
		title: {
			type: String
		},
		parameters: {
			type: Array
		},
		data: {
			type: Object
		},
		editable: {
			type: Boolean,
			default: true
		},
		selectParameter: {
			type: String,
			default: null
		},
		parent: {
			type: Object,
			default: null
		}
	},
	data() {
		return {
			show: true,
			values: Utils.deepClone(this.data)
		};
	},
	computed: {
		submitFunction() {
			if (this.$listeners.save) {
				return this.save;
			}
			else {
				return null;
			}
		}
	},
	methods: {
		save() {
			try {
				this.$emit('save', this.values);
				this.show = false;
			} catch (error) {
				Utils.exception(this, error);
			}
		}
	}
};
</script>