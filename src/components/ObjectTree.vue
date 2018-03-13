<template>
	<em v-if="isEmpty">None</em>
	<em v-else-if="collapsed">... (<a @click="toggle()">show all {{ data.length }} entries</a>)</em>
	<ul v-else>
		<li v-for="(value, key) in data" :key="key">
			<template v-if="shouldShowKey"><em>{{ prettifyKey(key) }}</em>: </template>
			<ObjectTree v-if="showObjectTree(value)" :data="value"></ObjectTree>
			<template v-else>{{ value }}</template>
		</li>
	</ul>
</template>

<script>
export default {
    name: 'ObjectTree',
	props: ['data'],
	data() {
		return {
			collapsed: false,
			isObjectTree: true
		};
	},
	created() {
		this.collapsed = (Array.isArray(this.data) && this.data.length > 50 && this.$parent.isObjectTree);
	},
	computed: {
		shouldShowKey() {
            // the first item's type is regarded as representative for the whole array despite arrays of mixed types being possible in JS
            return !(Array.isArray(this.data) && this.data.length > 0 && typeof this.data[0] !== 'object');
		},
        isEmpty() {
            return this.data == null
                || Array.isArray(this.data) && this.data.length == 0
                || typeof this.data == 'object' && Object.keys(this.data).length == 0;
		},
	},
    methods: {
		toggle() {
			this.collapsed = !this.collapsed;
		},
		showObjectTree(value) {
			return (typeof value === 'object') && !this.collapsed;
		},
        prettifyKey(key) {
            if(this.$utils.isNumeric(key)) {
                return key;
            } else {
				// Camelcase converter
				key = key.replace(/([a-z])([A-Z])/g, '$1 $2')
				// Kebab case converter
				key = key.replace(/([a-zA-Z\d])_([a-zA-Z\d])/g, '$1 $2');
				// Uppercase the first letter in the first word
                return key.charAt(0).toUpperCase() + key.substr(1);
            }
        }
    }
};
</script>