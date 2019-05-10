import Vue from 'vue';
import Vuex from 'vuex';
import server from './server'

Vue.use(Vuex);

export default new Vuex.Store({
	modules: {
		server
	}
});