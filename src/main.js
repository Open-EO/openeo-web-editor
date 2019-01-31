import Vue from 'vue';
import Config from '../config.js';
import Editor from './Editor.vue';
import Snotify from 'vue-snotify';
import 'vue-snotify/styles/simple.css';
import utils from './utils.js';

Vue.use(Snotify);

Vue.prototype.$config = Config;
Vue.prototype.$utils = utils;

Vue.config.productionTip = false;
Vue.config.errorHandler = function (err, vm, info) {
	console.log(err);
	if (vm && vm.$snotify) {
		vm.$snotify.error(err.message || err, 'Fatal error', utils.snotifyDefaults);
	}
};

window.App = new Vue({
	render: h => h(Editor)
}).$mount('#app');