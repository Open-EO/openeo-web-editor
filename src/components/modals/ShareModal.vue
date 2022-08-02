<template>
	<Modal minWidth="50%" title="Export / Share" @closed="$emit('closed')">
		<ul class="share-list">
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
		url: {
			type: String,
			required: true
		},
		title: {
			type: String,
			default: ""
		},
		extra: {
			type: Object,
			default: () => ({})
		},
		context: {
			type: Object,
			required: true
		}
	},
	computed: {
		components() {
			if (this.context instanceof Job && Array.isArray(Config.supportedBatchJobSharingServices)) {
				return Config.supportedBatchJobSharingServices;
			}
			else if (this.context instanceof Service && Array.isArray(Config.supportedWebServiceSharingServices)) {
				return Config.supportedWebServiceSharingServices;
			}
			return [];
		},
		componentProps() {
			return {
				...this.$props,
				type: this.context.constructor.name.toLowerCase()
			};
		}
	}
};
</script>

<style scoped lang="scss">
.share-list {
	list-style-type: none;
	margin: 0;
	padding: 0;
	border: 1px solid #ccc;

	> li {
		display: block;
		border-top: 1px solid #ccc;
		padding: 0;

		&:empty {
			display: none;
		}
		&:first-of-type {
			border: 0;
		}
	}
}
</style>
