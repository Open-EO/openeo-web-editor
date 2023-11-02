<template>
	<div class="wizard-tab-content">
		<WizardTab v-if="!noProcessSelection" :pos="tabPos[0]" :parent="parent" title="Process" :beforeChange="checkProcessRequirements">
			<ChooseUserDefinedProcess :value="process" :namespace="processNamespace" @input="submitProcess" />
		</WizardTab>
		<WizardTab :pos="tabPos[1]" :parent="parent" title="Parameters" :beforeChange="checkParameterRequirements">
			<ChooseProcessParameters v-if="processSpec" v-model="args" :process="processSpec" />
			<p class="center" v-else-if="loading"><i class="fas fa-spinner fa-spin"></i> Loading process...</p>
			<p v-else>Process not available.</p>
		</WizardTab>
		<WizardTab :pos="tabPos[2]" :parent="parent" title="Finish">
			<ChooseProcessingMode v-model="mode" :title.sync="jobTitle" />
		</WizardTab>
	</div>
</template>

<script>
import ChooseProcessingMode from './tabs/ChooseProcessingMode.vue';
import ChooseProcessParameters from './tabs/ChooseProcessParameters.vue';
import ChooseUserDefinedProcess from './tabs/ChooseUserDefinedProcess.vue';
import WizardMixin from './WizardMixin';
import Utils from '../../utils';
import { ProcessGraph } from '@openeo/js-processgraphs';

export default {
	name: "UDP",
	mixins: [
		WizardMixin
	],
	components: {
		ChooseUserDefinedProcess,
		ChooseProcessingMode,
		ChooseProcessParameters
	},
	data() {
		return {
			loading: false,
			noProcessSelection: false,
			process: null,
			processSpec: null,
			processNamespace: 'user',
			args: {},
			jobTitle: "",
			mode: "",
		};
	},
	computed: {
		...Utils.mapGetters(['processes']),
		tabPos() {
			if (this.noProcessSelection) {
				return [null, 0, 1];
			}
			else {
				return [0, 1, 2];
			}
		},
		graph() {
			if (!this.process || !this.processSpec) {
				return null;
			}
			let [id, namespace] = Utils.extractUDPParams(this.process);
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
	async beforeMount() {
		if (typeof this.process === 'string' && this.process.length > 0) {
			const [id, ns] = Utils.extractUDPParams(this.process);
			this.noProcessSelection = true;
			this.process = id;
			if (ns) {
				this.processNamespace = ns;
			}
			let loaded = await this.checkProcessRequirements();
			if (!loaded) {
				this.$emit('close', `Sorry, the wizard can't load the requested process.`);
			}
		}
	},
	methods: {
		...Utils.mapActions(['loadProcess']),
		submitProcess(item) {
			this.process = item.id;
			if (item.namespace) {
				this.processNamespace = item.namespace;
			}
			this.parent.nextTab();
		},
		async checkProcessRequirements() {
			this.loading = true;
			try {
				this.processSpec = await this.loadProcess({
					id: this.process,
					namespace: this.processNamespace
				});
				this.loading = false;
				if (this.processSpec) {
					this.jobTitle = this.processSpec.id;
				}
				return true;
			} catch (error) {
				this.loading = false;
				console.warn(error);
				return false;
			}
		},
		checkParameterRequirements() {
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
