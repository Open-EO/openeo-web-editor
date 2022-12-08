<template>
	<div class="step choose-time">
		<p>{{ text }}</p>
		<SelectBox :options="options" :value="value" @input="v => $emit('input', v)" />
	</div>
</template>

<script>
import SelectBox from '../../datatypes/SelectBox.vue';
import Utils from '../../../utils';

export default {
	name: 'ChooseReducer',
	components: {
		SelectBox
	},
	props: {
		text: {
			type: String,
			default: "Please select a method for aggregation:"
		},
		allowEmpty: {
			type: Boolean,
			default: false
		},
		value: {
			type: String,
			default: "mean"
		}
	},
	computed: {
		...Utils.mapGetters(['processes']),
		options() {			
			let reducers = this.processes
				.all()
				.filter(p => {
					if (Array.isArray(p.categories) && p.categories.includes("reducer") && Array.isArray(p.parameters) && p.id !== 'array_element') {
						let params = p.parameters.filter(param => param.optional !== true);
						return (params.length === 1 && params[0].name === 'data');
					}
					return false;
				})
				.map(p => ({id: p.id, label: `${p.id} - ${p.summary}`}));
			reducers.unshift({id: "", label: "No composite"});
			return reducers;
		}
	}
}
</script>