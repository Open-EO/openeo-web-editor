import Vue from 'vue';
import Snotify from 'vue-snotify';
import 'vue-snotify/styles/simple.css';
import store from './store/index';
import Config from '../config';
import Page from './Page.vue';
import filters from './filters';
import Clipboard from 'v-clipboard';
import Utils from './utils';

Vue.use(Snotify);
Vue.use(Clipboard);

// Toasts don't time out in background tabs, so repeated messages would pile up otherwise
Vue.prototype.$snotify.single = function (type, message, title = null, config = undefined) {
	const isOpen = this.notifications.some(t => t.config.type === type && t.body === message && (t.title || null) === (title || null));
	if (!isOpen) {
		this[type](message, title, config);
	}
};

Vue.config.productionTip = false;
Vue.config.errorHandler = function (err, vm, info) {
	console.error(err, info);
	if (!vm || !vm.$snotify) {
		return;
	}

	Utils.exception(vm, err);
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
		Utils.exception(app, event.reason);
	}
	event.preventDefault();
	event.stopPropagation();
});
