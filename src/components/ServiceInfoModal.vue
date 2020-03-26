<template>
	<Modal ref="modal" minWidth="80%">
		<template #main>
			<section class="vue-component basedata">
				<div class="tabular"><label>ID:</label> <code class="value">{{ service.id }}</code></div>
				<div class="tabular"><label>Type:</label> <span class="value">{{ type }}</span></div>
				<div class="tabular"><label>URL:</label> <code class="value">{{ service.url }}</code></div>

				<div class="tabular"><label>Enabled:</label> <span class="value boolean">
					<span v-if="service.enabled === true"><i class="fas fa-check-circle"></i></span>
					<span v-else-if="service.enabled === false"><i class="fas fa-times-circle"></i></span>
					<span v-else><i class="fas fa-question-circle"></i></span>
				</span></div>

				<div class="tabular" v-if="service.submitted"><label>Submitted:</label> <code class="value">{{ submitted }}</code></div>
			</section>

			<section class="vue-component billing" v-if="service.plan || service.costs || service.budget">
				<h3>Billing</h3>
				<div class="tabular" v-if="service.plan"><label>Billing plan:</label> <span class="value">{{ service.plan }}</span></div>
				<div class="tabular" v-if="service.costs"><label>Costs:</label> <span class="value">{{ formatCurrency(service.costs) }}</span></div>
				<div class="tabular" v-if="service.budget"><label>Budget:</label> <span class="value">{{ formatCurrency(service.budget) }}</span></div>
			</section>

			<section class="vue-component description" v-if="service.description">
				<h3>Description</h3>
				<Description :description="service.description"></Description>
			</section>

			<section class="process-graph">
				<div class="vue-component"><h3>Process</h3></div>
				<Editor :process="service.process" :editable="false" :enableExecute="false" class="infoViewer" id="servicePgViewer" />
			</section>

			<section class="vue-component parameters" v-if="hasParameters">
				<h3>Parameters</h3>

				<div class="tabular" v-for="(value, key) in service.parameters" :key="key">
					<label>{{ key }}:</label>
					<div class="value">
						<ObjectTree v-if="typeof formattedValue === 'object'" :data="value" />
						<template v-else>{{ formattedValue }}</template>
					</div>
				</div>
			</section>

			<section class="vue-component attributes" v-if="hasAttributes">
				<h3>Attributes</h3>

				<div class="tabular" v-for="(value, key) in service.attributes" :key="key">
					<label>{{ key }}:</label>
					<div class="value">
						<ObjectTree v-if="typeof formattedValue === 'object'" :data="value" />
						<template v-else>{{ formattedValue }}</template>
					</div>
				</div>
			</section>
		</template>
	</Modal>
</template>

<script>
import Utils from '../utils';
import Modal from './Modal.vue';
import Description from '@openeo/vue-components/components/Description.vue';
import ObjectTree from '@openeo/vue-components/components/ObjectTree.vue';
import Editor from './Editor.vue';

export default {
	name: 'ServiceInfoModal',
	components: {
		Description,
		Editor,
		Modal,
		ObjectTree
	},
	computed: {
		...Utils.mapGetters('server', ['formatCurrency']),
		hasAttributes() {
			return Utils.size(this.service.attributes) > 0;
		},
		hasParameters() {
			return Utils.size(this.service.parameters) > 0;
		},
		submitted() {
			return Utils.formatDateTime(this.service.submitted);
		},
		type() {
			if (typeof this.service.type === 'string') {
				return this.service.type.toUpperCase();
			}
			else {
				return '';
			}
		},
		displayTitle() {
			return "Web Service: " + (this.service.title || this.type + " #" + this.service.id);
		}
	},
	data() {
		return {
			service: {}
		};
	},
	methods: {
		show(service) {
			this.service = service;
			this.$refs.modal.show(this.displayTitle);
		}
	}
}
</script>