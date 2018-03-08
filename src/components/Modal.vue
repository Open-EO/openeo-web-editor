<template>
<div id="modal" class="modal" v-if="shown" @click="possiblyClose">
	<div class="modal-container">
		<h2 class="modal-header">
			{{ title }}
			<span class="close" @click="close">&times;</span>
		</h2>
		<div class="modal-content" id="modal-content">
			<template v-if="typeof body === 'string'">{{ body }}</template>
			<component v-else :is="compname" v-bind="props"></component>
		</div>
	</div>
</div>
</template>

<script>
import EventBus from '../eventbus.js';
import List from './List.vue';
import ServerSelector from './ServerSelector.vue';

export default {
	name: 'Modal',
	components:  {
		List,
		ServerSelector
	},
	data() {
		return {
			title: '',
			body: null,
			props: null,
			compname: null,
			shown: false
		};
	},
	mounted() {
		EventBus.$on('showModal', this.showModal);
		EventBus.$on('showComponentModal', this.showComponentModal);
	},
	methods: {
		show() {
			this.shown = true;
		},

		close() {
			this.shown = false;
		},

		possiblyClose(event) {
			if(event.target == document.getElementById('modal')) {
				this.close();
			}
		},

		initCommonModal(title) {
			this.title = title;
		},

		initTextModal(title, body) {
			this.initCommonModal(title);
			this.body = body;
			this.compname = null;
			this.props = null;
		},

		initComponentModal(title, compname, props) {
			this.initCommonModal(title);
			this.body = null;
			this.compname = compname;
			this.props = props;
		},

		showModal(title, data) {
			if (typeof data === 'string') {
				this.initTextModal(title, body);
				this.show();
			}
			else {
				this.showComponentModal(title, 'List', {data: data});
			}
		},

		showComponentModal(title, compname, props) {
			this.initComponentModal(title, compname, props);
			this.show();
		}
	}
};
</script>

<style>
.modal {
    position: fixed;
    z-index: 10000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgb(0,0,0);
    background-color: rgba(0,0,0,0.4);
}

.modal-header {
	background-color: #f7f7f7;
    padding: 20px;
	margin: 0px;
}

.modal-content {
    padding: 20px;
}

.modal-container {
    background-color: #fefefe;
    margin: 10% auto;
    border: 1px solid #888;
    width: 80%;
}

.close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
}

.close:hover, .close:focus {
    color: black;
    text-decoration: none;
    cursor: pointer;
}
</style>
