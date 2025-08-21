<template>
	<Modal :show="show" minWidth="60%" width="90%" :title="title" @closed="$emit('closed')" :submitFunction="submitFunction">
		<template #default>
			<p v-if="parameters.length === 0">No editable parameters available.</p>
			<template v-else>
				<Parameters v-model="values" :parameters="commonParams" :editable="editable" :selectParameter="selectParameter" :parent="parent" />
				<Collapse v-if="advancedParams.length > 0" title="Advanced Parameters" headingTag="h4" class="advanced-params">
					<Parameters v-model="values" :parameters="advancedParams" :editable="editable" :parent="parent" />
				</Collapse>
			</template>
		</template>
	</Modal>
</template>

<script>
import Utils from '../../utils';
import Modal from './Modal.vue';
import Parameters from '../Parameters.vue';
import Collapse from '@openeo/vue-components/components/internal/Collapse.vue';

export default {
	name: 'ParameterModal',
	components: {
		Collapse,
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
		commonParams() {
			return this.parameters.filter(param => !param.advanced);
		},
		advancedParams() {
			return this.parameters.filter(param => param.advanced);
		},
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

<style lang="scss">
.advanced-params {
	h4 {
		margin: 1em 0;
		font-weight: 600;
		font-size: 1em;
	}
}
</style>