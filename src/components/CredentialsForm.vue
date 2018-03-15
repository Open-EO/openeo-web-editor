<template>
    <div>
        <label for="username">Username:</label>
        <input id="username" type="text" v-model="username"/>
        <label for="username">Password:</label>
        <input id="password" type="password" v-model="password"/>
        <button @click="submit">OK</button>
        <button @click="cancel">Cancel</button>
    </div>
</template>

<script>
import EventBus from '../eventbus.js';
export default {
    name: 'CredentialsForm',
    props: ['submitCallback', 'cancelCallback'],
    data() {
        return {
            username: '',
            password: ''
        };
    },
    mounted() {
        EventBus.$on('modalClosed', this.cancelCallback);
    },
    methods: {
        submit() {
            const closeAfterCompletion = this.submitCallback(this.username, this.password);
            if(closeAfterCompletion === true && this.$utils.isChildOfModal(this)) {
                EventBus.$emit('closeModal');
            }
        },
        cancel() {
            this.cancelCallback();
            if(this.$utils.isChildOfModal(this)) {
                EventBus.$emit('closeModal');
            }
        }
    }
};
</script>

<style scoped>
    input {
        margin-right: 10px;
    }
    label {
        margin-right: 5px;
    }
</style>
