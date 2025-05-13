<template>
	<Modal width="80%" :title="title" @closed="$emit('closed')">
		<Service :service="service" :currency="currency" :federation="federation">
			<template #process-graph>
				<Editor :value="service.process" :editable="false" class="infoViewer" id="servicePgViewer" />
			</template>
		</Service>
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
	props: {
		service: {
			type: Object
		}
	},
	computed: {
		...Utils.mapGetters(['currency', 'federation']),
		title() {
			return "Web Service: " + (this.service.title || "#" + this.service.id);
		}
	}
}
</script>

<style lang="scss">
.vue-component.service > h2 {
	display: none;
}
</style>