<template>
	<ShareInterface
		id="share-edc" title="EDC" :description="description" :action="upload"
		actionDefaultIcon="https://avatars.githubusercontent.com/u/53830971?s=200&v=4" @stateChanged="state => this.state = state">
	</ShareInterface>
</template>

<script>
import ShareMixin from './ShareMixin';
import ShareInterface from './ShareInterface.vue';

export default {
    name: 'EDCShare',
	components: {
		ShareInterface
	},
	mixins: [
		ShareMixin
	],
	data() {
		return {
			state: 'default'
		};
	},
	computed: {
		description() {
			if (this.state === 'error') {
				return 'Publishing to eurodatacube failed';
			}
			else if (this.state === 'success') {
				return 'Published on eurodatacube';
			}
			else {
				return 'Publish results on eurodatacube (EDC)';
			}
		}
	},
    methods: {
        upload() {
            const formData = new FormData();
            formData.append("my-file.json", JSON.stringify(this.extra));
            return axios.post(
                '/api/upload',
                formData,
            );
        }
    }
}
</script>

<style lang="scss">
#share-edc {
	&.shareable > .entry {
		color: #004170;
	}
}
</style>