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
		<WizardTab v-if="needsSaveResult" :pos="tabPos[2]" :parent="parent" title="File Format" :beforeChange="() => format !== null">
			<ChooseFormat v-model="format" :gisDataType="gisDataType" />
		</WizardTab>
		<WizardTab :pos="tabPos[3]" :parent="parent" title="Finish">
			<ChooseProcessingMode v-model="mode" :title.sync="jobTitle" :process="graph" />
		</WizardTab>
	</div>
</template>

<script>
import ChooseProcessingMode from './tabs/ChooseProcessingMode.vue';
import ChooseProcessParameters from './tabs/ChooseProcessParameters.vue';
import ChooseUserDefinedProcess from './tabs/ChooseUserDefinedProcess.vue';
import ChooseFormat from './tabs/ChooseFormat.vue';
import WizardMixin from './WizardMixin';
import Utils from '../../utils';
import { ProcessGraph } from '@openeo/js-processgraphs';
import { Builder } from '@openeo/js-client';
import { ProcessSchema } from '@openeo/js-commons';

export default {
	name: "UDP",
	mixins: [
		WizardMixin
	],
	components: {
		ChooseUserDefinedProcess,
		ChooseProcessingMode,
		ChooseProcessParameters,
		ChooseFormat
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
			format: null,
		};
	},
	computed: {
		...Utils.mapGetters(['processes']),
		processSchema() {
			if (!Utils.isObject(this.processSpec?.returns?.schema)) {
				return null;
			}
			return new ProcessSchema(this.processSpec.returns.schema);
		},
		gisDataType() {
			if (!this.processSchema) {
				return null;
			}
			const types = [];
			if (this.processSchema.is('raster-cube')) {
				types.push('raster');
			}
			if (this.processSchema.is('vector-cube')) {
				types.push('vector');
			}
			const dcSchema = this.processSchema.schemas.find(s => s.subtype === 'datacube');
			if (Array.isArray(dcSchema?.dimensions)) {
				const dimTypes = dcSchema.dimensions.map(d => d.type);
				if (dimTypes.includes('spatial')) {
					types.push('raster');
				}
				if (dimTypes.includes('geometry')) {
					types.push('vector');
				}
			}
			return types.length === 1 ? types[0] : null;
		},
		needsSaveResult() { // null = unknown, true = needs save_result, false = doesn't need save_result.
			if (this.processSpec?.process_graph) {
				// Detect whether the process graph contains a save_result node.
				const graph = this.processSpec.process_graph;
				return !Object.values(graph).some(node => node.process_id === 'save_result');
			}
			else if (this.processSchema) {
				// Check what the return value process schema specifies.
				const subtypes = this.processSchema.subtypes();
				return subtypes.includes('datacube') || subtypes.includes('raster-cube') || subtypes.includes('vector-cube');
			}
			else {
				return null;
			}
		},
		tabPos() {
			const tabs = [
				!this.noProcessSelection, // Process
				true, // Parameters
				this.needsSaveResult, // File Format
				true // Finish
			];
			let index = 0;
			return tabs.map(enabled => enabled ? index++ : null);
		},
		graph() {
			if (!this.process || !this.processSpec) {
				return null;
			}
			const b = new Builder(this.processes);
			b.addProcessSpec(this.processSpec, this.processNamespace);
			let result = b.process(`${this.process}@${this.processNamespace}`, this.args, this.processSpec.summary);
			if (this.needsSaveResult && this.format) {
				result = b.save_result(result, this.format);
			}
			result.result = true;
			return b.toJSON();
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
