<template>
	<div :class="classes" :id="id">
		<div class="entry" @click="toggle">
			<span v-if="icon" class="toggle">
				<img v-if="iconIsImage" :src="icon" />
				<i v-else :class="['fas', icon]"></i>
			</span>
			<slot name="summary" v-bind="$props" :expanded="expanded" :state="state" :icon="icon">
				<div class="summary">
					<strong>{{ title }}</strong>
					<small v-if="description">{{ description }}</small>
				</div>
			</slot>
		</div>
		<div v-if="expanded" class="customize">
			<slot name="customize" v-bind="$props" :expanded="expanded"></slot>
		</div>
	</div>
</template>

<script>

export default {
	name: 'ShareInterface',
	props: {
		title: {
			type: String,
			default: null
		},
		description: {
			type: String,
			default: null
		},
		id: {
			type: String,
			default: null
		},
		data: {
			type: Object,
			default: () => ({})
		},
		action: {
			// Function: An action to execute on click
			// String: A URL to open on click
			// null (default): Use the customize slot
			type: [Function, String],
			default: null
		},
		// Font Awesome Icon identifiers or a URL to an image (png, jpeg, gif, webp)
		actionDefaultIcon: { // Default
			type: String,
			default: 'fa-share'
		},
		actionLoadingIcon: { // When loding
			type: String,
			default: 'fa-spinner fa-spin'
		},
		actionSuccessIcon: { // on success (for a couple of seconds)
			type: String,
			default: 'fa-check'
		},
		actionErrorIcon: { // on error (for a couple of seconds)
			type: String,
			default: 'fa-times'
		}
	},
	data() {
		return {
			expanded: false,
			state: 'default'
		};
	},
	computed: {
		classes() {
			let classes = ['shareable'];
			if (this.expanded) {
				classes.push('expanded');
			}
			if (!this.action) {
				classes.push('customizable');
			}
			else {
				classes.push(this.state);
			}
			return classes;
		},
		iconIsImage() {
			return this.icon.includes('/');
		},
		icon() {
			if (typeof this.action === 'function') {
				let fn = this.state[0].toUpperCase() + this.state.substr(1);
				return this[`action${fn}Icon`];
			}
			else if (typeof this.action === 'string') {
				return 'fa-external-link-alt';
			}
			else {
				return this.expanded ? 'fa-caret-down' : 'fa-caret-right';
			}
		}
	},
	watch: {
		state(newState) {
			this.$emit('stateChanged', this.state);
			if (newState === 'success' || newState === 'error') {
				setTimeout(() => this.state = 'default', 3000);
			}
		}
	},
	methods: {
		toggle() {
			if (typeof this.action === 'function') {
				try {
					this.state = 'loading';
					let result = this.action(this.data);
					if (result instanceof Promise) {
						result
							.then(() => this.state = 'success')
							.catch(() => this.state = 'error')
					}
					else {
						this.state = result ? 'success' : 'error';
					}
				} catch (error) {
					this.state = 'error';
				}
			}
			else if (typeof this.action === 'string') {
				window.open(this.action, '_blank').focus();
			}
			else {
				this.expanded = !this.expanded;
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.shareable {
	> .entry {
		display: flex;
		color: #1665B6;
		align-items: center;
		padding: 0.5em;
		font-size: 1.2em;
		line-height: 1.5em;

		&:hover {
			color: black;
			background-color: #eee;
		}

		> .summary {
			cursor: pointer;
			flex-grow: 1;
			display: flex;
			align-items: center;

			> small {
				&:before {
					content: ' — ';
					margin-left: 0.6em;
					margin-right: 0.4em;
				}
			}
		}

		> .toggle {
			user-select: none;
			width: 1.5em;
			margin-right: 0.5rem;
			text-align: center;

			img {
				max-height: 1.5em;
				max-width: 1.5em;
			}
		}
	}
	> .customize {
		padding: 1em;
	}
	&.expanded > .entry {
		color: white;
		background-color: #1665B6;
	}
	&.success > .entry {
		color: green !important;
	}
	&.error > .entry {
		color: maroon !important;
	}
}
</style>