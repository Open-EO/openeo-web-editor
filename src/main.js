import axios from 'axios';
import OpenEO from 'openeo-js-client/openeo.js';
import OpenEOVisualizations from './visualizations.js';
import Vue from 'vue';
import Config from './config.js';
import Editor from './Editor.vue';

OpenEO.Visualizations = OpenEOVisualizations;

// Making axios and OpenEO available globally
window.axios = axios;
window.OpenEO = OpenEO;

Vue.config.productionTip = false;

Vue.prototype.$config = Config;
Vue.prototype.$OpenEO = OpenEO;

new Vue({
  render: h => h(Editor)
}).$mount('#app');