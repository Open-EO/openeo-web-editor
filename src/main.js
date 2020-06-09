import Vue from 'vue';
import Snotify from 'vue-snotify';
import 'vue-snotify/styles/simple.css';
import store from './store/index';
import Config from '../config';
import Page from './Page.vue';
import filters from './filters';

Vue.use(Snotify);

Vue.config.productionTip = false;
Vue.config.errorHandler = function (err, vm, info) {
	console.error(err, info);
	if ((err instanceof Error || typeof err === 'string') && vm && vm.$snotify) {
		vm.$snotify.error(err.message || err, 'Fatal error', Config.snotifyDefaults);
	}
};

for(var name in filters) {
	Vue.filter(name, filters[name]);
}

new Vue({
	store,
	render: h => h(Page)
}).$mount('#app');