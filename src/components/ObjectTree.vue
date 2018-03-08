<template>
<em v-if="isEmpty(data)">empty</em>
<ul v-else>
    <li v-for="(value, key) in data" :key="key">
        <template v-if="!isArrayOfPrimitives(data)"><em>{{ prettifyKey(key) }}</em></template>
        <ObjectTree v-if="typeof value === 'object'" :data="value"></ObjectTree>
        <template v-else>{{ value }}</template>
    </li>
</ul>
</template>

<script>
export default {
    name: 'ObjectTree',
    props: ['data'],
    methods: {
        isEmpty(data) {
            return data == null
                || Array.isArray(data) && data.length == 0
                || typeof data == 'object' && Object.keys(data).length == 0;
        },
        isArrayOfPrimitives(data) {
            // the first item's type is regarded as representative for the whole array despite arrays of mixed types being possible in JS
            return Array.isArray(data) && data.length > 0 && typeof data[0] !== 'object';
        },
        prettifyKey(key) {
            if(this.isNumeric(key)) {
                return key;
            } else {
                return key
                    // split at each underscore (removing that underscore) and at each upper case letter (leaving that letter)
                    .split(/_|(?=[A-Z])/)
                    // capitalize each word that is longer than 2 characters
                    .map((e) => e.length <= 2 ? e : e.charAt(0).toUpperCase() + e.substr(1))
                    // join with spaces
                    .join(' ');
            }
        },
        isNumeric(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },
    }
};
</script>

<style>
li > em:first-child:after {
    content: ": ";
}
</style>
