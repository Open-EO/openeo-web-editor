<template>
    <div>
		<form id="loginForm" @submit.prevent="submitLogin">
			<h3>Login</h3>
			<label for="username">Username:</label>
			<input id="username" type="text" v-model="username"/>
			<label for="password">Password:</label>
			<input id="password" type="password" v-model="password"/>
			<button type="submit">Login</button>
		</form>
		<form id="registerForm" @submit.prevent="submitRegister" v-if="showRegistration">
			<h3>Register</h3>
			<label for="registerPassword">Password:</label>
			<input id="registerPassword" type="password" ref="registerPassword"/>
			<button type="submit">Register</button>
		</form>
    </div>
</template>

<script>
import EventBus from '../eventbus.js';
export default {
    name: 'CredentialsForm',
    props: ['submitLoginCallback', 'submitRegisterCallback', 'cancelCallback'],
    data() {
        return {
            username: '',
			password: '',
			registered: false
        };
	},
	computed: {
		showRegistration() {
			return (!this.registered && typeof this.submitRegisterCallback === 'function') ? true : false;
		}
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
					if(this.$utils.isChildOfModal(this)) {
						EventBus.$emit('closeModal');
					}
				})
				.catch(error => {});
		},
		submitRegister(event) {
			var password = this.$refs.registerPassword.value;
			this.submitRegisterCallback(password)
				.then(data => {
					this.registered = true;
					this.username = data.user_id;
					this.password = password;
				})
				.catch(error => {});
		}
    }
};
</script>

<style scoped>
#registerForm {
	margin-top: 1em;
}
input {
	margin-right: 15px;
}
label {
	margin-right: 5px;
}
</style>
