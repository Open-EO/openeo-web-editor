import Vue from 'vue';
import Vuex from 'vuex';
import server from './server';
import editor from './editor';

Vue.use(Vuex);

export default new Vuex.Store({
	modules: {
		server,
		editor
	}
});