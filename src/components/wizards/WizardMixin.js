import WizardTab from './components/WizardTab.vue';

export default {
	components: {
		WizardTab
	},
	props: {
		parent: {
			type: Object,
			required: true
		},
		options: {
			type: Object,
			default: () => ({})
		}
	},
	created() {
		for(let key in this.options) {
			this[key] = this.options[key];
		}
	}
};