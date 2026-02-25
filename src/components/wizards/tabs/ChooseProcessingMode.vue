<template>
	<div class="step choose-processing-mode">
		<template v-if="isAuthenticated && (supportsJobs || supportsSync)">
			<div class="validation" v-if="canValidate">
				<h3>Validation</h3>
				<p v-if="!validation">
					<i class="fas fa-spinner fa-spin"></i>
					Validation in progress...
				</p>
				<div v-else-if="invalid">
					<p class="error">❌ Validation failed.</p>
					<p>Please see the details below for more information and go back to the previous steps to correct the issues.</p>
					<Logs class="logs" hideHeader :logs="validation" />
				</div>
				<p v-else class="success">✅ Validation successful!</p>
			</div>
			<h3>Execution Mode</h3>
			<p>Please select how you'd like to execute this workflow?</p>
			<ul class="mode">
				<li v-if="supportsJobs">
					<input type="radio" id="job" value="job" v-model="mode" :disabled="invalid" />
					<label for="job">
						<strong>Batch Jobs</strong><br />
						Slower processing mode for large amounts of data. Creates and queues a batch job.<br />
						It is recommended to provide a title for the batch job:
						<input type="text" ref="title" v-model="titleInput" :disabled="invalid" />
					</label>
				</li>
				<li v-if="supportsSync">
					<input type="radio" id="sync" value="sync" v-model="mode" :disabled="invalid" />
					<label for="sync">
						<strong>Synchronous Processing</strong><br />
						Fast processing mode for small amounts of data.
					</label>
				</li>
				<li>
					<input type="radio" id="model" value="" v-model="mode" />
					<label for="model">
						<strong>Don't execute</strong><br />
						Only show the generated workflow in the visual model builder.
						You can then export it or you can run it later.
					</label>
				</li>
			</ul>
		</template>
		<p v-else>
			The wizard has all information to create the workflow for you.<br />
			<template v-if="isAuthenticated">Unforntunately, this back-end can't process data,</template>
			<template v-else>You are not logged in and thus you can't process data directly,</template>
			but you can insert the process into the visual model builder now.
		</p>
	</div>
</template>

<script>
import Utils from '../../../utils';

export default {
	name: 'ChooseProcessingMode',
	components: {
		Logs: () => import('@openeo/vue-components/components/Logs.vue')
	},
	props: {
		value: {
			type: String,
			default: null
		},
		title: {
			type: String,
			default: ""
		},
		process: {
			type: Object,
			default: null
		}
	},
	data() {
		return {
			mode: this.value,
			validation: null
		};
	},
	created() {
		this.validate();
	},
	computed: {
		...Utils.mapState(['connection', 'isAuthenticated']),
		...Utils.mapGetters(['supports']),
		invalid() {
			return this.validation && this.validation.length > 0;
		},
		titleInput: {
			get() {
				return this.title;
			},
			set(value) {
				this.$emit('update:title', value);
			}
		},
		supportsJobs() {
			return this.supports('createJob') && this.supports('startJob');
		},
		supportsSync() {
			return this.supports('computeResult');
		},
		canValidate() {
			return this.isAuthenticated && this.process && this.supports('validateProcess');
		},
	},
	watch: {
		value() {
			this.mode = this.value;
		},
		mode() {
			this.$emit('input', this.mode);
			if (this.mode === 'job') {
				this.$refs.title.select();
			}
		},
		title() {
			this.$emit('update:title', this.title);
		}
	},
	methods: {
		async validate() {
			if (!this.canValidate) {
				return;
			}
			try {
				const errors = await this.connection.validateProcess(this.process);
				// log entries require a `level` attribute
				errors.forEach(error => error.level = 'error');
				this.validation = errors;
			} catch (error) {
				this.validation = [
					{
						message: "An error during validation occured, which is likely a server or client issue: " + error.message,
						level: 'error'
					}
				]
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.validation {
	min-height: 8em;

	.success {
		color: green;
		font-weight: 600;
	}
	.error {
		color: maroon;
		font-weight: 600;
	}
}
.mode {
	padding-left: 3em;

	> li {
		list-style-type: none;
		margin-bottom: 1em;
		line-height: 1.5em;

		> label > strong {
			display: inline-block;
			margin-bottom: 0.5em;
			margin-left: 0.5em;
		}

		> input {
			margin-left: -3em;
			display: inline-block;
		}
	}
}
</style>