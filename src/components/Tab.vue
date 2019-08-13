<template>
	<div v-show="enabled && active" class="tabContent">
		<slot :tab="this"></slot>
	</div>
</template>


<script>
export default {
	name: 'Tab',
	props: {
		id: {
			type: String,
			required: true
		},
		name: {
			type: String,
			required: true
		},
		icon: {
			type: String,
			default: null
		},
		selected: {
			type: Boolean,
			default: false
		},
		enabled: {
			type: Boolean,
			default: true
		},
		closable: {
			type: Boolean,
			default: false
		},
		allowShow: {
			type: Function,
			default: null
		}
	},
	data() {
		return {
			active: false
		};
	},
	watch: {
		active(newValue) {
			// Make sure the component is really shown by using nextTick...
			if (newValue) {
				this.$nextTick(() => this.$emit('show', this));
			}
			else {
				this.$nextTick(() => this.$emit('hide', this));
			}
		}
	},
	mounted() {
		if (this.selected) {
			this.show();
		}
		else {
			this.active = false;
		}
	},
	methods: {
		async show() {
			if (this.active) {
				return true;
			}
			if (typeof this.allowShow !== 'function' || await this.allowShow()) {
				this.active = true;
			}
			return this.active;
		},
		hide() {
			this.active = false;
		},
		close() {
			this.$emit('close', this);
		}
	}
}
</script>