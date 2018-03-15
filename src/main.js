import Vue from 'vue';
import Config from './config.js';
import Editor from './Editor.vue';
import Snotify from 'vue-snotify';
import 'vue-snotify/styles/simple.css';
import utils from './utils.js';

Vue.use(Snotify, {
	toast: {
		timeout: 5000
	}
});

Vue.prototype.$config = Config;
Vue.prototype.$utils = utils;

Vue.config.productionTip = false;
Vue.config.errorHandler = function (err, vm, info) {
	utils.error(vm, err.message);
	console.log(err);
};

window.App = new Vue({
	render: h => h(Editor)
}).$mount('#app');