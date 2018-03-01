import axios from 'axios';
import OpenEO from 'openeo-js-client/openeo.js';
import OpenEOVisualizations from './visualizations.js';
import Vue from 'vue';
import Config from './config.js';
import Editor from './Editor.vue';
import 'fontawesome-web/css/fontawesome-all.css'
import Snotify from 'vue-snotify';
import 'vue-snotify/styles/simple.css';
import utils from './utils.js';

OpenEO.Visualizations = OpenEOVisualizations;

// Making axios and OpenEO available globally
window.axios = axios;
// ToDo: Check what is required to remove this line and solely depeng on this.$OpenEO in Vue.
window.OpenEO = OpenEO;

Vue.use(Snotify);

Vue.prototype.$config = Config;
Vue.prototype.$OpenEO = OpenEO;
Vue.prototype.$capabilities = {};
Vue.prototype.$utils = utils;

Vue.config.productionTip = false;
Vue.config.errorHandler = function (err, vm, info) {
	utils.error(vm, err.message);
	console.log(err);
};

window.app = new Vue({
	render: h => h(Editor)
}).$mount('#app');