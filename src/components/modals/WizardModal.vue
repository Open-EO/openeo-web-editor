<template>
	<Modal id="WizardModal" :show="show" :width="width" :title="title" :submitFunction="nextTab" @closed="$emit('closed')">
		<template #default>
			<div v-if="selected" class="wizard">
				<div class="wizard-navigation">
					<div class="wizard-progress-with-circle">
						<div class="wizard-progress-bar" :style="progressBarStyle"></div>
					</div>
					<ul class="wizard-nav wizard-nav-pills" role="tablist">
						<wizard-step v-for="(tab, i) in tabs" :key="i" :tab="tab" @click.native="navigateToTab(i)" @keyup.enter.native="navigateToTab(i)" :index="i" />
					</ul>
				</div>
				<component ref="component" :is="selected.component" :parent="self" :options="options" @input="execute" @close="close" />
			</div>
			<div v-else class="start">
				<div class="message warning">
					<i class="fas fa-bullhorn"></i>
					<span>Please note that this feature is <strong>experimental</strong> and there are chances that the generated models won't work.</span>
				</div>
				<p>This wizard helps you to create openEO processes in a simple way for some common use cases.</p>
				<p>Which use case do you want to work on today?</p>
				<ul>
					<template v-for="usecase in usecases">
						<li v-if="!usecase.hide" :key="usecase.component" @click="start(usecase)" class="element">
							<div class="summary">
								<strong>{{ getUsecaseTitle(usecase) }}</strong>
								<small>{{ usecase.description }}</small>
							</div>
						</li>
					</template>
				</ul>
			</div>
		</template>
		<template #footer>
			<template v-if="selected">
				<div class="wizard-back">
					<span @click="prevTab" @keyup.enter="prevTab" v-if="activeTabIndex > 0" role="button" tabindex="0">
						<button tabindex="-1" type="button">Back</button>
					</span>
					<span @click="reset" @keyup.enter="reset" v-else-if="!selected.hide" role="button" tabindex="0">
						<button tabindex="-1" type="button">Start over</button>
					</span>
				</div>
				<div class="wizard-next">
					<span @click="nextTab" @keyup.enter="nextTab" v-if="isLastStep" role="button" tabindex="0">
						<button tabindex="-1" type="button">Create</button>
					</span>
					<span @click="nextTab" @keyup.enter="nextTab" role="button" tabindex="0" v-else>
						<button tabindex="-1" type="button">Next</button>
					</span>
				</div>
			</template>
		</template>
	</Modal>
</template>

<script>
import Modal from './Modal.vue';
import WizardStep from '../wizards/components/WizardStep.vue';
import Utils from '../../utils';
import Config from '../../../config';
import EventBusMixin from '../EventBusMixin';
import { CancellableRequestError } from '../cancellableRequest';

const wizards = Config.supportedWizards || [];
let components = {
	Download: () => import('../wizards/Download.vue'),
	UDP: () => import('../wizards/UDP.vue'),
	Modal,
	WizardStep,
};
for(let wizard of wizards) {
	components[wizard.component] = () => import(`../wizards/${wizard.component}.vue`);
}

export default {
	name: "WizardModal",
	mixins: [EventBusMixin],
	components,
	data() {
		return {
			show: true,
			selected: null,
			usecases: [
				{
					component: 'Download',
					title: 'Download Data',
					description: 'Just download a small portion of data.'
				},
				{
					component: 'UDP',
					title: () => typeof this.options.process === 'string' ? this.options.process.replace(/@.+/, '') : 'Run UDP',
					description: 'Executes a user-defined process'
				},
				...(Config.supportedWizards || []) // ToDo: only show usecases that are supported based on processes (requiredProcesses)
			],
			activeTabIndex: 0,
			currentPercentage: 0,
			maxStep: 0,
			tabs: [],
			process: null
		};
	},
	props: {
		preselectUsecase: {
			type: String,
			default: null
		},
		options: {
			type: Object,
			default: () => ({})
		}
	},
	created() {
		if (this.preselectUsecase) {
			this.selected = this.usecases.find(uc => uc.component === this.preselectUsecase) || null;
		}
	},
	computed: {
		...Utils.mapGetters(['supports']),
		supportsJobs() {
			return this.supports('createJob') && this.supports('startJob');
		},
		supportsSync() {
			return this.supports('computeResult');
		},
		self() {
			return this;
		},
		width() {
			return this.selected ? "90%" : "50%";
		},
		title() {
			let title = 'Process Wizard';
			if (this.selected) {
				title += ': ' + this.getUsecaseTitle(this.selected);
			}
			return title;
		},
		isLastStep () {
			return this.activeTabIndex === this.tabs.length - 1;
		},
		progressBarStyle () {
			return {
				backgroundColor: this.color,
				width: `${this.progress}%`,
				color: this.color
			};
		},
		progress () {
			let percentage = 1 / (this.tabs.length * 2) * 100;
			if (this.activeTabIndex > 0) {
				percentage = percentage * (this.activeTabIndex * 2 + 1);
			}
			return percentage;
		}
	},
	methods: {
		...Utils.mapMutations('editor', ['setProcess']),
		start(selected) {
			this.selected = selected;
		},
		reset() {
			this.selected = null;
			this.activeTabIndex = 0;
			this.currentPercentage = 0;
			this.maxStep = 0;
			this.tabs = [];
		},
		close(error = null) {
			this.show = false;
			if (error) {
				Utils.error(this, error, "Wizard Error");
			}
		},
		async execute({process, mode, modeOptions}) {
			// Add process to model builder
			this.setProcess(process);

			// Execute
			if (mode == 'sync' && this.supportsSync) {
				this.broadcast('executeProcess');
			}
			else if (mode == 'job' && this.supportsJobs) {
				this.broadcast('startAndQueueProcess', modeOptions);
			}
		},
		getUsecaseTitle(usecase) {
			if (typeof usecase.title == 'function') {
				return usecase.title();
			}
			else {
				return usecase.title;
			}
		},
		addTab(item, pos) {
			this.tabs.splice(pos, 0, item);
			// if a step is added before the current one, go to it
			if (pos < this.activeTabIndex + 1) {
				this.maxStep = pos;
				this.changeTab(this.activeTabIndex + 1, pos);
			}
		},
		removeTab(item) {
			const index = this.tabs.indexOf(item);
			if (index > -1) {
				// Go one step back if the current step is removed
				if (index === this.activeTabIndex) {
					this.maxStep = this.activeTabIndex - 1;
					this.changeTab(this.activeTabIndex, this.activeTabIndex - 1);
				}
				if (index < this.activeTabIndex) {
					this.maxStep = this.activeTabIndex - 1;
					this.activeTabIndex = this.activeTabIndex - 1;
				}
				this.tabs.splice(index, 1);
			}
		},
		navigateToTab(index) {
			let validate = index > this.activeTabIndex;
			if (index <= this.maxStep) {
				let cb = () => {
					if (validate && index - this.activeTabIndex > 1) {
						// validate all steps recursively until destination index
						this.changeTab(this.activeTabIndex, this.activeTabIndex + 1);
						this.beforeTabChange(this.activeTabIndex, cb);
					}
					else {
						this.changeTab(this.activeTabIndex, index);
						this.afterTabChange(this.activeTabIndex);
					}
				}
				if (validate) {
					this.beforeTabChange(this.activeTabIndex, cb);
				}
				else {
					this.setValidationError(null);
					cb();
				}
			}
			return index <= this.maxStep;
		},
		nextTab() {
			let cb = () => {
				if (this.activeTabIndex < this.tabs.length - 1) {
					this.changeTab(this.activeTabIndex, this.activeTabIndex + 1);
					this.afterTabChange(this.activeTabIndex);
				}
				else if (this.isLastStep) {
					this.$refs.component.finish()
						.then(this.close)
						.catch(error => {
							if (error instanceof CancellableRequestError) {
								if (error.isError) {
									Utils.exception(this, error, error.title);
								}
								else {
									Utils.ok(this, error.message, error.title);
								}
								if (error.close) {
									this.close();
								}
							}
							else {
								Utils.exception(this, error);
							}
						});
				}
			}
			this.beforeTabChange(this.activeTabIndex, cb);
		},
		prevTab() {
			let cb = () => {
				if (this.activeTabIndex > 0) {
					this.setValidationError(null);
					this.changeTab(this.activeTabIndex, this.activeTabIndex - 1);
				}
			}
			if (this.validateOnBack) {
				this.beforeTabChange(this.activeTabIndex, cb);
			} else {
				cb();
			}
		},
		setValidationError(error) {
			if (error) {
				Utils.error(this, error);
			}
			this.tabs[this.activeTabIndex].validationError = error;
		},
		beforeTabChange(index, callback) {
			const fallbackMsg = "Please fill the form";
			this.setValidationError(null);
			let oldTab = this.tabs[index];
			if (oldTab && oldTab.beforeChange !== undefined) {
				try {
					let result = oldTab.beforeChange();
					if (result instanceof Promise) {
						result
							.then(result => result ? callback() : this.setValidationError(fallbackMsg))
							.catch(error => this.setValidationError(error.message))
					}
					else if (result) {
						callback();
					}
					else {
						this.setValidationError(fallbackMsg)
					}
				} catch(error) {
					this.setValidationError(error.message);
				}
			}
			else {
				callback();
			}
		},
		afterTabChange(index) {
			let newTab = this.tabs[index];
			if (newTab && newTab.afterChange !== undefined) {
				newTab.afterChange();
			}
		},
		changeTab(oldIndex, newIndex) {
			let oldTab = this.tabs[oldIndex];
			let newTab = this.tabs[newIndex];
			if (oldTab) {
				oldTab.active = false;
			}
			if (newTab) {
				newTab.active = true;
			}
			this.activeTabIndex = newIndex;
			this.activateTabAndCheckStep(this.activeTabIndex);
			return true;
		},
		deactivateTabs() {
			this.tabs.forEach(tab => tab.active = false);
		},
		activateTab(index) {
			this.deactivateTabs();
			let tab = this.tabs[index];
			if (tab) {
				tab.active = true;
				tab.checked = true;
			}
		},
		activateTabAndCheckStep(index) {
			this.activateTab(index);
			if (index > this.maxStep) {
				this.maxStep = index;
			}
			this.activeTabIndex = index;
		},
		initializeTabs() {
			if (this.tabs.length > 0 && this.startIndex === 0) {
				this.activateTab(this.activeTabIndex);
			}
			if (this.startIndex < this.tabs.length) {
				this.activateTabAndCheckStep(this.startIndex);
			}
			else {
				console.warn(`Prop startIndex set to ${this.startIndex} is greater than the number of tabs - ${this.tabs.length}. Make sure that the starting index is less than the number of tabs registered`);
			}
		}
	}
}
</script>

<style lang="scss">
@import '../../../theme.scss';
#WizardModal .modal-container {
	height: 90%;
}
#WizardModal .modal-footer {
	display: flex;

	&:empty {
		display: none;
	}

	> div {
		flex: 1;
	}

	.wizard-back {
		text-align: left;
	}
}
#WizardModal .modal-content {
	display: flex;
	padding: 0;

	.start {
		padding: 1rem;

		ul {
			margin: 1em 0;
			padding: 0;

			li {
				list-style-type: none;
			}
		}
	}

	.start, .step {
		p:first-of-type {
			margin-top: 0;
		}
	}

	.wizard {
		$size: 40px;
		$font-size: 16px;
		$computed-font-size: calc($size/2 + 5px);

		flex-grow: 1;
		display: flex;
		overflow: hidden;
		flex-direction: column;
		align-items: stretch;
		padding: 0;

		.wizard-icon-circle {
			width: $size;
			height: $size;
			font-size: $font-size;
			border: 3px solid #ccc;
			border-radius: 50%;
			font-weight: bold;
			background-color: #fff;
			position: relative;
			display: flex;
			justify-content: center;
			align-content: center;

			.wizard-icon-container {
				display: flex;
				justify-content: center;
				flex: 1;
				border-radius: 50%;
				margin: -3px;
			}

			.wizard-icon {
				display: flex;
				align-items: center;
				justify-content: center;
			}
		}

		.wizard-tab-content {
			overflow: auto;
			margin: 0;
			padding: 1rem;
			flex-grow: 1;
			display: flex;
			flex-direction: column;
		}
	
		.wizard-tab-container {
			flex-grow: 1;
			display: flex;
			flex-direction: column;
		}

		.wizard-header {
			padding: 15px 15px 15px 15px;
			position: relative;
			border-radius: 3px 3px 0 0;
			text-align: center;
		}

		.wizard-navigation {
			padding: 0.5rem 0 1rem 0;
			border-bottom: 1px solid #ccc;

			.wizard-progress-with-circle {
				position: relative;
				height: 4px;
				top: $computed-font-size;

				.wizard-progress-bar {
					box-shadow: none;
					transition: width .3s ease;
				}
			}
		}

		// Bar of progress
		.wizard-progress-bar {
			float: left;
			width: 0%;
			height: 100%;
			font-size: 12px;
			line-height: 20px;
			color: #fff;
			text-align: center;
			background-color: $mainColor;
			box-shadow: inset 0 -1px 0 rgba(0,0,0,.15);
			transition: width .6s ease
		}

		.wizard-nav-pills {
			margin: 0;
			padding: 0;
			position: relative;
			text-align: center;
			display: grid;
			grid-auto-flow: column;
  			grid-auto-columns: 1fr;

			li {
				list-style-type: none;
			}
			li, a {
				align-items: center;
				flex-wrap: wrap;
  				flex-grow: 1;
			}
			a {
				display: flex;
			}

			$form-placeholder-color: rgba(0,0,0,.2) !default;
			> li > a {
				display: flex;
				flex-direction: column;
				padding: 0;
				margin: 0 auto;
				color: $form-placeholder-color;
				position: relative;
				top: 3px;
				&:hover,
				&:focus{
					background-color: transparent;
					color: $form-placeholder-color;
					outline: 0 !important;
				}
				&.disabled {
					pointer-events: none;
					cursor: default;
				}
			}


			.error {
				.wizard-icon-circle {
					border-color: maroon !important;
				}
				.wizard-icon-container {
					background: maroon !important;
				}
				.stepTitle {
					color: maroon !important;
				}
			}
			.active {
				.wizard-icon-circle {
					border-color: $mainColor;
				}
				.wizard-icon-container {
					background: $mainColor;
				}
				.stepTitle {
					color: $mainColor;
				}
			}
			.checked {
				.wizard-icon-circle {
					border-color: $mainColor;
				}
			}

			> li.active > a .wizard-icon {
				font-size: $font-size;
			}

			> li.active > a,
			> li.active > a:hover,
			> li.active > a:focus {
				background-color: transparent;
				transition: font-size .2s linear;

				.wizard-icon {
					color: #fff;
					font-size: 24px;
					display:flex;
					align-items:center;
					justify-content: center;
					transition: all .2s linear;
				}
			}
		}
	}

	.element {
		display: flex;
		margin: 0.25em 0;
		padding: 0;
		border: 1px solid #ddd;
		border-radius: 3px;
		cursor: pointer;
		user-select: none;

		.summary {
			flex-grow: 1;
			padding: 0.5em;
			width: 100%;
			overflow: hidden; 
			position: relative;

			strong {
				display: block;
				color: $linkColor;
			}

			small {
				margin-top: 0.25em;
				display: block;
			}

			&:hover {
				background-color: #eee;

				strong {
					color: #000;
				}
			}
		}

		&.selected {
			.summary {
				border-color: $linkColor;
				background-color: $linkColor;
				color: white;

				strong {
					color: white;
				}

				&:hover {
					background-color: $linkColor;
				}
			}
		}

		.button {
			display: block;
			margin: 0;
			padding: 0.5em;
			background-color: #fff;
			color: #aaa;
			border: 0;
			border-left: 1px solid #ddd;

			&:hover {
				background-color: #eee;
				color: #000;
			}
		}
	}
}
</style>