<template>
    <ul>
        <li v-for="item in items" :key="item">
            <a @click="doMainAction(item)">{{ item }}</a>
            <button v-for="action in actions" :key="action.icon" :title="action.title" @click="doAction(action.callback, item)">
                <i :class="'fas fa-'+action.icon"></i>
            </button>
        </li>
    </ul>
</template>

<script>
export default {
    name: 'List',
    props: ['items', 'actions'],
    methods: {
        doAction(callback, item) {
            const closeAfterCompletion = callback(item);
            if(closeAfterCompletion === true && this.$parent && this.$parent.$options.name == 'Modal') {
                this.$parent.close();
            }
        },
        doMainAction(item) {
            if(this.actions.length > 0) {
                this.doAction(this.actions[0].callback, item);
            }
        }
    }
};
</script>

<style scoped>
    li {
        padding-bottom: 0.3em;
    }
    li a {
        margin-right: 5px;
    }
</style>
