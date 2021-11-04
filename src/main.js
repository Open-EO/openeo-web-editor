import Vue from 'vue';
import Snotify from 'vue-snotify';
import 'vue-snotify/styles/simple.css';
import store from './store/index';
import Config from '../config';
import Page from './Page.vue';
import filters from './filters';
import Clipboard from 'v-clipboard';

Vue.use(Snotify);
Vue.use(Clipboard)

Vue.config.productionTip = false;
Vue.config.errorHandler = function (err, vm, info) {
	console.error(err, info);
	if (!vm || !vm.$snotify) {
		return;
	}
	if (err instanceof Error) {
		vm.$snotify.error(err.message, 'Error', Config.snotifyDefaults);
	}
	else if (typeof err === 'string') {
		vm.$snotify.error(err, 'Error', Config.snotifyDefaults);
	}
};

Vue.prototype.$config = Config;

for(var name in filters) {
	Vue.filter(name, filters[name]);
}

new Vue({
	store,
	render: h => h(Page)
}).$mount('#app');