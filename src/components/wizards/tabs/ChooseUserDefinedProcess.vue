<template>
	<div class="step choose-process">
		<p>Please select the user-defined process to execute:</p>
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
		<hr />
		<p>Alternatively, provide a URL to a user-defined process:</p>
		<input type="url" name="url" class="url" :value="url" @blur="updateUrl" />
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
			default: null
		},
		url: {
			type: String,
			default: null
		}
	},
	computed: {
		...Utils.mapGetters(['processes']),
		filteredProcesses() {
			return this.processes.namespace(this.namespace || 'user');
		}
	},
	methods: {
		...Utils.mapActions(['describeUserProcess']),
		update(id) {
			this.$emit('input', id);
		},
		updateUrl(event) {
			const url = event.target.value;
			if (!url) {
				return;
			}
			else if (Utils.isUrl(url)) {
				this.$emit('input', url, true);
			}
			else {
				throw new Error('The provided URL is not valid.');
			}
		},
		showProcess(item) {
			this.broadcast('showProcess', item);
		}
	}
}
</script>

<style lang="scss">
.choose-process {
	input.url {
		width: 100%;
		box-sizing: border-box;
	}

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