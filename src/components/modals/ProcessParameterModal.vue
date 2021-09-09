<template>
	<Modal width="50%" :title="title" @closed="$emit('closed')">
		<div class="processParameterModal">
			<p class="message info" v-if="udp">
				<i class="fas fa-info-circle"></i>
				<span>
					This is a parameter for a user-defined process.
					It is a value made available by the parent entity (usually another process or a secondary web service) that is executing this processes for further use.
					See below for details about this parameter:
					</span>
			</p>
			<ProcessParameter :parameter="parameter" />
		</div>
	</Modal>
</template>

<script>
import Modal from './Modal.vue';
import ProcessParameter from '@openeo/vue-components/components/internal/ProcessParameter.vue';

export default {
	name: 'ProcessParameterModal',
	components: {
		Modal,
		ProcessParameter
	},
	props: {
		parameter: {
			type: Object
		},
		udp: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		title() {
			return this.parameter.name || 'Unnamed Parameter';
		}
	}
}
</script>

<style lang="scss">
.processParameterModal {
	.message {
		margin-top: 0;
	}
	.process-parameter {
		> h4 {
			margin-top: 0;
		}
		> .details {
			margin-left: 0;
		}
	}
}
</style>