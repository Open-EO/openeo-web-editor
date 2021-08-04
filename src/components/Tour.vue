<template>
	<v-tour class="web-editor-tour" name="tour" :steps="steps" :callbacks="callbacks" :options="options" />
</template>

<script>
import Utils from '../utils.js';
import VueTour from 'vue-tour';
import Vue from 'vue';

Vue.use(VueTour);

export default {
	name: 'Tour',
	props: {
		value: {
			type: String, // one of: connect, login, ide, ...
			default: null
		}
	},
	data() {
		return {
			callbacks: {
				onSkip: this.onEnd,
				onFinish: this.onEnd
			},
			options: {
//				highlight: true, // Doesn't always work?
				labels: {
					buttonSkip: 'Skip tour', //'Skip tour (ESC)', - don't promote ESC key right now due to bug https://github.com/pulsardev/vue-tour/issues/202
					buttonPrevious: 'Previous ⇦',
					buttonNext: 'Next ⇨',
					buttonStop: 'Finish' //'Finish (ESC)',
				}
			},
			enableScrolling: [], // Add sub-tour name if scrolling should be enabled
			entries: {
				'ide-discovery': {
					title: 'Service Offerings',
					content: 'This section allows you to discover and search through the service offerings such as the available data sets (collections), the supported processes etc.'
				},
				'ide-editor': {
					title: 'Process Editor',
					content: 'This is the editor for the processes. We recommend to work in "Visual Model" mode, where you can create processing chains simply by adding collections and processes and connecting them with each other. The "Code" mode allows to see the generated JSON process, which is usually only needed if you want to run the process using another client library such as Python or R.'
				},
				'ide-workspace': {
					title: 'User Workspace',
					content: 'In this area you can find your personal workspace, which lists your stored batch jobs, web services and files.'
				},
				'ide-viewer': {
					title: 'Data Viewer',
					content: 'This area you can use to preview collections or inspect the results of batch jobs, web services or other computations. It will also be used to display log messages, if available.'
				}
			}
		};
	},
	mounted() {
      	this.$tours['tour'].start();
	},
	watch: {
		value(value) {
			if (value !== null) {
      			this.$tours['tour'].start();
			}
		}
	},
	computed: {
		...Utils.mapState(['isAuthenticated']),
		instructions() {
			let steps = [];
			switch(this.value) {
				case 'ide':
					steps.push('ide-discovery');
					steps.push('ide-editor');
					if (this.isAuthenticated) {
						steps.push('ide-workspace');
					}
					steps.push('ide-viewer');
					break;
				default:
					if (this.value !== null) {
						Utils.error(this, 'Sorry, no tour available yet.');
					}
			}
			return steps;
		},
		steps() {
			let steps = [];
			for(let entry of this.instructions) {
				if (typeof entry === 'string') {
					entry = [entry];
				}
				let data = this.entries[entry[0]];
				let obj = {
					target: `.tour-${entry[0]}`,
					header: {
						title: data.title,
					},
					content: data.content,
					params: {
						placement: entry[1] || 'auto',
						enableScrolling: this.enableScrolling.includes(this.value)
					}
				};
				steps.push(obj);
			}
			return steps;
		}
	},
	methods: {
		onEnd() {
			this.$emit('input', null);
		}
	}
}
</script>

<style lang="scss">
@import '~vue-tour/dist/vue-tour.css';
@import '../../theme.scss';

.web-editor-tour {
	.v-step {
		background-color: $mainColor;
		color: white;
	}
	.v-step__header {
		background-color: rgba(0,0,0,0.2);
	}
	.v-step__content {
		text-align: justify;
	}
	.v-step__arrow--dark:before {
		background-color: $mainColor;
	}
}
</style>