<template>
    <div v-show="shown && active" class="tabContent">
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
		shown: {
			type: Boolean,
			default: true
		},
		onActivate: {
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
		active() {
			if (typeof this.onActivate === 'function') {
				this.onActivate();
			}
		}
	},
    mounted() {
        this.active = this.selected;
    }
}
</script>