import Vue from 'vue';
import Snotify from 'vue-snotify';
import 'vue-snotify/styles/simple.css';
import store from './store/index';
import Config from '../config';
import Page from './Page.vue';
import filters from './filters';
import Clipboard from 'v-clipboard';

Vue.use(Snotify);
Vue.use(Clipboard);

// Don't show too many repetitive error messages
Vue.prototype.$snotify.singleError = function () {
	let message = arguments[0];
	if (message !== this.lastMessage) {
		this.lastMessage = message;
		this.error(...arguments);
		setTimeout(() => this.lastMessage = null, 1000);
	}
};

Vue.config.productionTip = false;
Vue.config.errorHandler = function (err, vm, info) {
	console.error(err, info);
	if (!vm || !vm.$snotify) {
		return;
	}

	let message;
	if (err instanceof Error) {
		message = err.message;
	}
	else if (typeof err === 'string') {
		message = err;
	}

	if (message) {
		vm.$snotify.singleError(message, 'Error', Config.snotifyDefaults);
	}
};
Vue.prototype.$config = Config;

for(var name in filters) {
	Vue.filter(name, filters[name]);
}

const app = new Vue({
	store,
	render: h => h(Page)
}).$mount('#app');

window.addEventListener("unhandledrejection", function(event) {
	console.warn(event);
	if (typeof event.reason === 'String' || event.reason instanceof Error) {
		app.$snotify.singleError(event.reason, 'Error', Config.snotifyDefaults);
	}
	event.preventDefault();
	event.stopPropagation();
});
