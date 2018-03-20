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
import EventBus from '../eventbus.js';
export default {
    name: 'List',
    props: ['dataSource', 'actions'],
    computed: {
        items() {
            return (typeof this.dataSource == 'function' ? this.dataSource() : this.dataSource);
        }
    },
    methods: {
        doAction(callback, item) {
            const closeAfterCompletion = callback(item);
            if(closeAfterCompletion === true && this.$utils.isChildOfModal(this)) {
                EventBus.$emit('closeModal');
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
