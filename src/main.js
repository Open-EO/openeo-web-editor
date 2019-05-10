import Vue from 'vue';
import Snotify from 'vue-snotify';
import 'vue-snotify/styles/simple.css';
import store from './store/index';
import Config from '../config';
import Editor from './Editor.vue';

Vue.use(Snotify);

Vue.config.productionTip = false;
Vue.config.errorHandler = function (err, vm, info) {
	console.log(err);
	if (vm && vm.$snotify) {
		vm.$snotify.error(err.message || err, 'Fatal error', Config.snotifyDefaults);
	}
};

new Vue({
	store,
	render: h => h(Editor)
}).$mount('#app');