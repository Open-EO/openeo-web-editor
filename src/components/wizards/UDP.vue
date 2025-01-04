<template>
	<div class="wizard-tab-content">
		<WizardTab v-if="!noProcessSelection" :pos="tabPos[0]" :parent="parent" title="Process" :beforeChange="checkProcessRequirements">
			<ChooseUserDefinedProcess :value="process" :namespace="processNamespace" :url="processUrl" @input="submitProcess" />
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
			processUrl: null,
			processSpec: null,
			processNamespace: null,
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
			let node = {
				process_id: this.process,
				arguments: this.args,
				result: true
			};
			if (Utils.hasText(this.processNamespace)) {
				node.namespace = this.processNamespace;
			}
			if (Utils.hasText(this.processSpec.summary)) {
				node.description = this.processSpec.summary;
			}
			return {
				process_graph: {
					[this.process]: node
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
		submitProcess(item, isUrl = false) {
			if (isUrl) {
				this.processUrl = item;
			}
			else {
				this.process = item.id;
				if (item.namespace) {
					this.processNamespace = item.namespace;
				}
				this.parent.nextTab();
			}
		},
		async loadFromUrl(url) {
			if (!Utils.isUrl(url)) {
				throw new Error('Please provide a valid URL!');
			}
			let data;
			try {
				const response = await Utils.axios().get(url);
				data = response.data;
			} catch(error) {
				throw new Error('Failed to load process from the given URL');
			}
			if (typeof data === 'string') {
				try {
					data = JSON.parse(data);
				} catch(error) {
					throw new Error('Process is not valid JSON');
				}
			}
			if (!Utils.isObject(data)) {
				throw new Error('Process does not contain any data');
			}
			if (!Utils.hasText(data.id)) {
				throw new Error('Process does not contain an id');
			}
			if (!Utils.isObject(data.process_graph)) {
				throw new Error('Process does not contain a process graph');
			}
			return data;
		},
		async checkProcessRequirements() {
			this.loading = true;
			if (this.processUrl) {
				const process = await this.loadFromUrl(this.processUrl);
				this.processes.add(process, this.processUrl);
				this.processNamespace = this.processUrl;
				this.process = process.id;
				this.processSpec = process;
			}
			else if (this.process) {
				this.processSpec = await this.loadProcess({
					id: this.process,
					namespace: this.processNamespace
				});
			}
			else {
				throw new Error('Please select a user-defined process');
			}
			this.loading = false;
			if (this.processSpec) {
				this.jobTitle = this.processSpec.id;
			}
			return true;
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
