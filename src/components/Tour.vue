<template>
	<v-tour class="web-editor-tour" name="tour" :steps="steps" :callbacks="callbacks" :options="options" />
</template>

<script>
import Utils from '../utils.js';
import VueTour from 'vue-tour';
import Vue from 'vue';
import 'vue-tour/dist/vue-tour.css';

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
				onFinish: this.onEnd,
				onStop: this.onEnd
			},
			options: {
//				highlight: true, // Doesn't always work?
				labels: {
					buttonSkip: 'Skip tour', //'Skip tour (ESC)', - don't promote ESC key right now due to bug https://github.com/pulsardev/vue-tour/issues/202
					buttonPrevious: '⇦ Previous',
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
					content: 'In this area you can find your personal workspace, which lists your stored batch jobs, web services, custom processes and files.'
				},
				'ide-viewer': {
					title: 'Data Viewer',
					content: 'This area is for previewing collections or inspecting the results of batch jobs, web services or other computations. It will also be used to display log messages, if available.'
				},

				'connect-url': {
					title: 'Provide server address',
					content: `Enter the address of the server you wish to connect to here. If you don't know any URL, you may head over to <a href="https://hub.openeo.org/" target="_blank">openEO Hub</a> to discover available servers.`
				},
				'connect-history': {
					title: 'Previously used servers',
					content: 'Clicking here will show a list of all servers that you have been connected to on this computer in the past.'
				},
				'connect-retry': {
					title: 'Connect button',
					content: 'The Web Editor tries to connect to the server automatically (you will see a spinning icon next to "Connect"). If the attempt fails, this can mean that the server is currently offline. You may click the button again to retry, or come back later. If the issue persists, please contact the server provider.'
				},

				'login-options': {
					target: '#credentials > .tabsHeader',
					title: 'Login Options',
					content: `You have several ways of authenticating with the server. Select the one you have credentials for. Usually, the first option is what you are supposed to use. If you don't know what to select, please ask your service provider for details or select "No credentials" to just have a (read-only) look at the service offerings.`
				},
				'login-internal': {
					target: '#credentials > .tabsHeader > button[title=Internal]',
					title: 'Internal',
					content: `Some servers support an additional authentication method, which is best-suited and recommended for development and testing purposes only. You just need to provide your username and password here, but usually, you'd want to select one of the other options, if available.`
				},
				'login-without': {
					target: '#credentials > .tabsHeader > button[title="No credentials"]',
					title: 'Without login',
					content: `It is possible to proceed without logging in, however, this means that you can only <em>explore</em> the service offerings but won't be able to actually access the actual EO data, submit calculations or store any data.`
				},
				'login-credentials': {
					target: '.tabContent:not([style*="display: none"]) .input',  // select first visible input
					title: 'Credentials of your account',
					content: `Enter your authentication information here. If you don't have an account yet, you have to register directly with the provider (this is not possible via openEO). The same applies if you forgot your password.`
				},
				'login-switch': {
					title: 'Wrong server?',
					content: `If you chose the wrong server, this link takes you back to the previous step so you can choose a different server.`
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
			else {
      			this.$tours['tour'].finish();
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
				case 'connect':
					if (!this.$config.serverUrl) {  // aka `if (allowOtherServers)`
						steps.push(['connect-url', 'top']);
						steps.push(['connect-history', 'right']);
					} else {  // fixed server URL use case
						steps.push(['connect-retry', 'bottom']);
					}
					break;
				case 'login':
					steps.push(['login-options', 'left']);
					if (document.querySelector(this.entries['login-internal'].target) !== null) {  // server has basic auth
						steps.push(['login-internal', 'top']);
					}
					steps.push(['login-without', 'top']);
					if (document.querySelector(this.entries['login-credentials'].target) !== null) {  // some login field is shown
						steps.push(['login-credentials', 'right']);
					}
					if (!this.$config.serverUrl) {  // aka `if (allowOtherServers)`
						steps.push('login-switch');
					}
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
					target: data.target || `.tour-${entry[0]}`,
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
@use '../../theme' as *;

.web-editor-tour {
	.v-step {
		background-color: $mainColor;
		color: white;
		border: 2px solid white;

		a {
			color: white;
			border-bottom: 1px dotted white;

			&:hover {
				border-bottom-style: solid;
			}
		}
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