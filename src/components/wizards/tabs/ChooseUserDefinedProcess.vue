<template>
	<div class="step choose-process">
		<p>Please select the user-defined process to execute.</p>
		<Processes heading="" :processes="filteredProcesses" :offerDetails="false">
			<template #summary="{ item }">
				<div :class="{element: true, selected: item.id == value}">
					<div class="summary" @click="update(item)">
						<strong :title="item.id">{{ item.id }}</strong>
						<small v-if="item.title" :title="item.title">{{ item.title }}</small>
					</div>
					<button class="button" type="button" @click="showProcess(item)" title="Show process details"><i class="fas fa-info"></i></button>
				</div>
			</template>
		</Processes>
	</div>
</template>

<script>
import Processes from '@openeo/vue-components/components/Processes.vue';
import Utils from '../../../utils';
import EventBusMixin from '../../EventBusMixin';

export default {
	name: 'ChooseUserDefinedProcess',
	mixins: [
		EventBusMixin
	],
	components: {
		Processes
	},
	props: {
		value: {
			type: String,
			default: null
		},
		namespace: {
			type: String,
			default: 'user'
		}
	},
	computed: {
		...Utils.mapGetters(['processes']),
		filteredProcesses() {
			return this.processes.namespace(this.namespace);
		}
	},
	methods: {
		...Utils.mapActions(['describeUserProcess']),
		async update(id) {
			this.$emit('input', id);
		},
		showProcess(item) {
			this.broadcast('showProcess', item);
		}
	}
}
</script>

<style lang="scss">
.choose-process {
	.vue-component.searchable-list ul.list > li {
		margin-bottom: 0;

		> summary {
			margin: 0;
			line-height: inherit;

			&:before {
				content: '';
				margin-left: 0;
				float: none;
			}
		}
	}
}
</style>