<template>
	<div :class="classes" :id="id">
		<div class="entry" @click="toggle">
			<span v-if="actionIcon" class="toggle">
				<img v-if="actionIconIsImage" :src="actionIcon" />
				<i v-else :class="faActionIcon"></i>
			</span>
			<slot name="summary" v-bind="$props" :expanded="expanded" :state="state" :icon="icon">
				<div class="summary">
					<strong>
						<span v-if="icon" class="icon">
							<img v-if="iconIsImage" :src="icon" />
							<i v-else :class="faIcon"></i>
						</span>
						{{ title }}
					</strong>
					<template v-if="description">
						<small class="sep">—</small>
						<small class="description" v-if="description">{{ description }}</small>
					</template>
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
		icon: { // Primary icon
			type: [String, Array],
			default: null
		},
		actionDefaultIcon: { // Default
			type: [String, Array],
			default: 'fa-share'
		},
		actionLoadingIcon: { // When loading
			type: [String, Array],
			default: 'fa-spinner fa-spin'
		},
		actionSuccessIcon: { // on success (for a couple of seconds)
			type: [String, Array],
			default: 'fa-check'
		},
		actionErrorIcon: { // on error (for a couple of seconds)
			type: [String, Array],
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
		faIcon() {
			if (Array.isArray(this.icon)) {
				return this.icon;
			}
			else {
				return ['fas', this.icon];
			}
		},
		actionIconIsImage() {
			return this.actionIcon.includes('/');
		},
		actionIcon() {
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
		},
		faActionIcon() {
			if (Array.isArray(this.actionIcon)) {
				return this.actionIcon;
			}
			else {
				return ['fas', this.actionIcon];
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
@import '../../../theme.scss';

.shareable {
	> .entry {
		display: flex;
		color: $mainColor;
		align-items: top;
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
			align-items: top;

			> strong {
				white-space: nowrap;
			}

			> small.sep {
				padding: 0 0.5em;
			}
		}

		> .toggle,
		.icon {
			display: inline-block;
			user-select: none;
			width: 1.5em;
			text-align: center;

			img {
				max-height: 1.5em;
				max-width: 1.5em;
			}
		}
		> .toggle {
			margin-right: 0.5rem;
		}
	}
	> .customize {
		padding: 1em;
	}
	.entry > .toggle {
		color: #555;
	}
	&.expanded > .entry,
	&.expanded > .entry > .toggle {
		color: white;
		background-color: $mainColor;
	}
	&.success > .entry > .toggle {
		color: green !important;
	}
	&.error > .entry > .toggle {
		color: maroon !important;
	}
}
</style>