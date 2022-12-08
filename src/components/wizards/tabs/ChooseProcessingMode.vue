<template>
	<div class="step choose-processing-mode">
		<template v-if="isAuthenticated && (supportsJobs || supportsSync)">
			<p>Please select how you'd like to execute this workflow?</p>
			<ul class="mode">
				<li v-if="supportsJobs">
					<input type="radio" id="job" value="job" v-model="mode" />
					<label for="job">
						<strong>Batch Jobs</strong><br />
						Slower processing mode for large amounts of data. Creates and queues a batch job.<br />
						It is recommended to provide a title for the batch job:
						<input type="text" ref="title" :value="title" @input="title => $emit('input:title', title)" />
					</label>
				</li>
				<li v-if="supportsSync">
					<input type="radio" id="sync" value="sync" v-model="mode" />
					<label for="sync">
						<strong>Synchronous Processing</strong><br />
						Fast processing mode for small amounts of data.
					</label>
				</li>
				<li v-if="supportsSync">
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
	props: {
		value: {
			type: String,
			default: null
		},
		title: {
			type: String,
			default: ""
		}
	},
	data() {
		return {
			mode: this.value
		};
	},
	computed: {
		...Utils.mapState(['isAuthenticated']),
		...Utils.mapGetters(['supports']),
		supportsJobs() {
			return this.supports('createJob') && this.supports('startJob');
		},
		supportsSync() {
			return this.supports('computeResult');
		}
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
			this.$emit('input:title', this.title);
		}
	}
}
</script>

<style lang="scss" scoped>
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