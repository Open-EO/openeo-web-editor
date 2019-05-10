<template>
    <div class="dataPanel">
		<form id="loginForm" @submit.prevent="submitLogin">
			<h3>Login</h3>
			<label for="username">Username:</label>
			<input id="username" type="text" v-model="username"/>
			<label for="password">Password:</label>
			<input id="password" type="password" v-model="password"/>
			<button type="submit">Login</button>
		</form>
    </div>
</template>

<script>
import EventBus from '../eventbus.js';
import Utils from '../utils.js';

export default {
    name: 'CredentialsForm',
    props: ['submitLoginCallback', 'cancelCallback'],
    data() {
        return {
            username: '',
			password: ''
        };
	},
    mounted() {
        EventBus.$on('modalClosed', this.cancelCallback);
    },
    destroyed() {
     	EventBus.$off('modalClosed', this.cancelCallback);
    },
    methods: {
        submitLogin(event) {
            this.submitLoginCallback(this.username, this.password)
				.then(data => {
					if(Utils.isChildOfModal(this)) {
     					EventBus.$off('modalClosed', this.cancelCallback);
						EventBus.$emit('closeModal');
					}
				})
				.catch(error => {});
		}
    }
};
</script>

<style scoped>
input {
	margin-right: 15px;
}
label {
	margin-right: 5px;
}
</style>
