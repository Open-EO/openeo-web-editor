<template>
	<Modal ref="modal" minWidth="85%">
		<template #main>
			<Service :service="service" :currency="currency">
				<template #process-graph>
					<Editor :value="service.process" :editable="false" class="infoViewer" id="servicePgViewer" />
				</template>
			</Service>
		</template>
	</Modal>
</template>

<script>
import Utils from '../../utils';
import Modal from './Modal.vue';
import Editor from '../Editor.vue';
import Service from '@openeo/vue-components/components/Service.vue';

export default {
	name: 'ServiceInfoModal',
	components: {
		Editor,
		Modal,
		Service
	},
	computed: {
		...Utils.mapGetters(['currency']),
		displayTitle() {
			return "Web Service: " + (this.service.title || "#" + this.service.id);
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

<style>
.vue-component h2 {
	display: none;
}
</style>