<template>
    <ul>
        <li v-for="url in serverUrls" :key="url">
            <span @click="submit(url)">{{ url }}</span>
        </li>
    </ul>
</template>

<script>
export default {
    name: 'ServerSelector',
    props: ['serverUrls', 'callback'],
    methods: {
        submit(url) {
            this.callback(url);
            if(this.$parent && this.$parent.$options.name == 'Modal') {
                this.$parent.close();
            }
        }
    }
};
</script>

<style>
    li {
        padding: 5px 0px;
    }
    li span {
        cursor: pointer;
    }
</style>
