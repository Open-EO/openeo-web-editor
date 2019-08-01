<template>
	<div v-show="enabled && active" class="tabContent">
		<slot name="tab" :tab="this"></slot>
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
			required: true
		},
		selected: {
			type: Boolean,
			default: false
		},
		enabled: {
			type: Boolean,
			default: true
		},
		onBeforeShow: {
			type: Function,
			default: null
		},
		onShow: {
			type: Function,
			default: null
		},
		onHide: {
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
			if (newValue && typeof this.onShow === 'function') {
				this.$nextTick(() => this.onShow());
			}
			else if (!newValue && typeof this.onHide === 'function') {
				this.$nextTick(() => this.onHide());
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
			if (typeof this.onBeforeShow !== 'function' || await this.onBeforeShow()) {
				this.active = true;
			}
			return this.active;
		},
		hide() {
			this.active = false;
		}
	}
}
</script>