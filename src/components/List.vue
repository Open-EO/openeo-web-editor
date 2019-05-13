<template>
    <ul>
        <li v-for="(item, key) in items" :key="key">
            <a :href="item" @click="doMainAction(isArray ? item : key, $event)" target="_blank">{{ isArray ? item : key }}</a>
            <button v-for="action in actions" :key="action.icon" :title="action.title" @click="doAction(action.callback, isArray ? item : key)">
                <i :class="'fas fa-'+action.icon"></i>
            </button>
        </li>
    </ul>
</template>

<script>
import EventBus from '../eventbus.js';
import Utils from '../utils.js';

export default {
    name: 'List',
    props: ['dataSource', 'actions'],
    computed: {
        items() {
            return (typeof this.dataSource == 'function' ? this.dataSource() : this.dataSource);
        },
        isArray() {
            return Array.isArray(this.items);
        }
    },
    methods: {
        doAction(callback, item) {
            const closeAfterCompletion = callback(item);
            if(closeAfterCompletion === true && Utils.isChildOfModal(this)) {
                EventBus.$emit('closeModal');
            }
        },
        doMainAction(item, event) {
            if(this.actions.length > 0) {
                this.doAction(this.actions[0].callback, item);
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }
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
