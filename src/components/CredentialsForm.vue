<template>
    <div>
        <label for="username">Username:</label>
        <input id="username" type="text" v-model="username"/>
        <label for="username">Password:</label>
        <input id="password" type="password" v-model="password"/>
        <button @click="submitCallback(username, password)">OK</button>
        <button @click="cancelCallback()">Cancel</button>
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
