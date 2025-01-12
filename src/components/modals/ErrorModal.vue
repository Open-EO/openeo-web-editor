<template>
	<Modal width="50%" :title="title" @closed="$emit('closed')" @shown="expand">
		<ul class="error-modal">
			<Log :log="log" ref="log"  />
		</ul>
	</Modal>
</template>


<script>
import Modal from './Modal.vue';
import Log from '@openeo/vue-components/components/internal/Log.vue';
import Utils from '../../utils';

export default {
	name: 'ErrorModal',
	components: {
		Log,
		Modal
	},
	props: {
		error: {
			type: Error,
			default: () => ({})
		}
	},
	computed: {
		log() {
			let data;
			if (Utils.isObject(this.error.config)) {
				if (this.error.config?.headers?.Authorization) {
					this.error.config.headers.Authorization = 'removed for security reasons';
				}
				data = {
					config: this.error.config,
					stack: this.error.stack
				};
			}
			else {
				data = this.error.stack;
			}
			return {
				id: this.error.id,
				code: this.error.code,
				level: 'error',
				message: this.error.message,
				time: new Date().toISOString(),
				data,
				links: this.error.links
			};
		},
		title() {
			if (typeof this.error.code === 'string' && this.error.code.length > 0) {
				let name = Utils.prettifyString(this.error.code);
				return `Error: ${name}`;
			}
			else {
				return "Error";
			}
		}
	},
	methods: {
		expand() {
			this.$nextTick(() => { // Expand the log details
				if (this.$refs.log && !this.$refs.log.expanded) {
					this.$refs.log.toggle();
				}
			});
		}
	}
}
</script>

<style lang="scss">
.error-modal {
	list-style-type: none;
	margin: 0;
	padding: 0;

	.vue-component {
		.badges {
			display: none;
		}
		.toggle {
			display: none !important;
		}
	}
}
</style>