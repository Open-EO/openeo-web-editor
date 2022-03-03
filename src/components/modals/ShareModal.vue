<template>
	<Modal title="Export / Share" @closed="$emit('closed')">
		<ul class="modal-list">
			<li v-for="component in components" :key="component">
				<component :is="component" v-bind="componentProps" />
			</li>
		</ul>
	</Modal>
</template>

<script>
import Modal from './Modal.vue';
import { Job, Service } from '@openeo/js-client';
import Config from '../../../config';

// Load all sharing components defined the config
const serviceComponents = (Config.supportedBatchJobSharingServices || []).concat(Config.supportedWebServiceSharingServices || []);
let components = { Modal };
for(let component of serviceComponents) {
	components[component] = () => import(`../share/${component}.vue`);;
}

export default {
	name: 'ShareModal',
	components,
	props: {
		context: {
			type: Object,
			required: true
		}
	},
	computed: {
		isJob() {
			return this.context instanceof Job;
		},
		isWebService() {
			return this.context instanceof Service;
		},
		components() {
			if (this.isJob && Array.isArray(Config.supportedBatchJobSharingServices)) {
				return Config.supportedBatchJobSharingServices;
			}
			else if (this.isWebService && Array.isArray(Config.supportedWebServiceSharingServices)) {
				return Config.supportedWebServiceSharingServices;
			}
			return [];
		},
		componentProps() {
			let props = {
				type: this.isJob ? 'job' : 'service',
				job: this.isJob ? this.context : null,
				service: this.isService ? this.context : null
			};
			return props;
		}
	},
	methods: {
		
        async doMainListAction(item, key) {
			// Doesn't need to go through job store as it doesn't change job-related data
			try {
				let result = await job.getResultsAsStac();
				if(Utils.size(result.assets) == 0) {
					Utils.error(this, 'No results available for job "' + Utils.getResourceTitle(job) + '".');
					return;
				}
				this.emit('showModal', 'ShareModal', {context: job});
			} catch(error) {
				Utils.exception(this, error, 'Download Result Error: ' + Utils.getResourceTitle(job));
			}
        }
	}
};
</script>

<style scoped lang="scss">
.modal-list {
	list-style-type: none;
	margin: 0;
	padding: 0;
	border: 1px solid #ccc;

	 li {
		cursor: pointer;
		display: block;
		border-top: 1px solid #ccc;
		padding: 0.5rem;
		color: #1665B6;
		display: flex;
		align-items: center;

		&:first-of-type {
			border: 0;
		}
		&:hover {
			color: black;
			background-color: #eee;
		}

		strong {
			flex-grow: 1;
			font-weight: normal;
		}
	}
}

.listEmpty {
    display: block;
    text-align: center;
}
</style>
