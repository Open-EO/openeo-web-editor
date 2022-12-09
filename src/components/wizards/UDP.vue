<template>
	<div class="wizard-tab-content">
		<WizardTab :pos="0" :parent="parent" title="Parameters" :beforeChange="checkRequirements">
			<ChooseProcessParameters v-if="processSpec" v-model="args" :process="processSpec" />
			<p class="center" v-else-if="loading"><i class="fas fa-spinner fa-spin"></i> Loading process...</p>
			<p v-else>Process not available.</p>
		</WizardTab>
		<WizardTab :pos="1" :parent="parent" title="Finish">
			<ChooseProcessingMode v-model="mode" :title.sync="jobTitle" />
		</WizardTab>
	</div>
</template>

<script>
import ChooseProcessingMode from './tabs/ChooseProcessingMode.vue';
import ChooseProcessParameters from './tabs/ChooseProcessParameters.vue';
import WizardMixin from './WizardMixin';
import Utils from '../../utils';
import { ProcessGraph } from '@openeo/js-processgraphs';

export default {
	name: "UDP",
	mixins: [
		WizardMixin
	],
	components: {
		ChooseProcessingMode,
		ChooseProcessParameters
	},
	data() {
		return {
			loading: true,
			process: null,
			processSpec: null,
			args: {},
			jobTitle: "",
			mode: "",
		};
	},
	computed: {
		...Utils.mapGetters(['processes']),
		graph() {
			if (!this.process || !this.processSpec) {
				return null;
			}
			let [id, namespace] = this.process.split('@');
			return {
				process_graph: {
					[id]: {
						process_id: id,
						namespace,
						description: this.processSpec.summary,
						arguments: this.args,
						result: true
					}
				}
			};
		}
	},
	async created() {
		this.loading = true;
		let [id, namespace] = this.process.split('@');
		try {
			this.processSpec = await this.loadProcess({id, namespace});
			if (this.processSpec) {
				this.jobTitle = this.processSpec.id;
			}
		} catch (error) {
			console.warn(error);
			this.$emit('close', `Sorry, the wizard can't load the requested process.`);
		} finally {
			this.loading = false;
		}
	},
	methods: {
		...Utils.mapActions(['loadProcess']),
		checkRequirements() {
			if (this.graph) {
				var pg = new ProcessGraph(this.graph, this.processes);
				return pg.validate();
			}
			return false;
		},
		async finish() {
			this.$emit('input', {
				process: this.graph,
				mode: this.mode,
				modeOptions: {
					title: this.jobTitle
				}
			});
		}
	}
}
</script>
