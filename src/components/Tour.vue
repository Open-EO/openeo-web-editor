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
					title: 'URL input',
					content: `Paste the URL of the server you wish to connect to into this field. If you don't know any URL, you may head over to <a href="https://hub.openeo.org/">openEO Hub</a> to discover available servers.`
				},
				'connect-history': {
					title: 'History of URLs',
					content: 'Clicking on this icon will open a window that displays all URLs that you have connected to in the past (provided your browser permits storing in Local Storage).'
				},

				'login-options': {
					target: '#credentials > .tabsHeader',
					title: 'Login Options',
					content: `You have several ways of authenticating with the server. The standard method is OpenID Connect (OIDC). If supported, you will see a button for each available OIDC provider here. Click on one to open its login form.`
				},
				'login-internal': {
					target: '#credentials > .tabsHeader > button[title=Internal]',
					title: 'User/Password',
					content: `Some servers support basic authentication with a simple username-password combination. This method is discouraged and generally only used for internal development purposes (hence the name of this button). We suggest to use OpenID Connect if you can.`
				},
				'login-without': {
					target: '#credentials > .tabsHeader > button[title="No credentials"]',
					title: 'Without login',
					content: `It is possible to proceed without any authentication, however, usually this means that you won't able to actually submit calculations etc. You can think of it as an "discovery only" mode.`
				},
				'login-credentials': {
					target: '.tabContent:not([style*="display: none"]) .input',  // select first visible input
					title: 'Credentials of your account',
					content: `Enter your authentication information here. If you don't have an account yet, you have to register directly with the provider (this is not possible via openEO). The same applies if you forgot your password.`
				},
				'login-switch': {
					title: 'Wrong server?',
					content: `If you chose the wrong server, this link takes you back to the previous step so you can choose a different server URL.`
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
				case 'connect':
					steps.push('connect-url');
					steps.push('connect-history');
					break;
				case 'login':
					steps.push(['login-options', 'left']);
					steps.push(['login-internal', 'top']);
					steps.push(['login-without', 'top']);
					steps.push(['login-credentials', 'right']);
					steps.push('login-switch');
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
@import '~vue-tour/dist/vue-tour.css';
@import '../../theme.scss';

.web-editor-tour {
	.v-step {
		background-color: $mainColor;
		color: white;
		border: 2px solid white;
	}
	/*
	// If the little arrow should have a border too:
	.v-step[data-popper-placement=left] .v-step__arrow--dark:before {
		border-top: 2px solid white;
		border-right: 2px solid white;
	}
	// likewise for popper-placement=right, top, bottom
	*/
	.v-step__header {
		background-color: rgba(0,0,0,0.2);
	}
	.v-step__content {
		text-align: justify;
	}
	.v-step__arrow--dark:before {
		background-color: $mainColor;
	}
	.v-step a {
		color: black;
	}
}
</style>