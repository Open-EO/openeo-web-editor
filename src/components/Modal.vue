<template>
<div id="modal" class="modal" v-if="shown" @click="possiblyClose">
	<div class="modal-container">
		<h2 class="modal-header">
			{{ title }}
			<span class="close" @click="close">&times;</span>
		</h2>
		<div class="modal-content" id="modal-content">
			<template v-if="typeof message === 'string'">{{ message }}</template>
			<div v-else-if="typeof html === 'string'" v-html="html"></div>
			<component v-else :is="compname" v-bind="props"></component>
		</div>
	</div>
</div>
</template>

<script>
import EventBus from '../eventbus.js';
import ObjectTree from './ObjectTree.vue';
import List from './List.vue';
import CredentialsForm from './CredentialsForm.vue';
import ProcessPanel from './ProcessPanel.vue';
import ProcessParameterEditor from './ProcessParameterEditor.vue';

export default {
	name: 'Modal',
	components:  {
		CredentialsForm,
		List,
		ProcessPanel,
		ProcessParameterEditor,
		ObjectTree
	},
	data() {
		return {
			title: '',
			message: null,
			html: null,
			props: null,
			compname: null,
			shown: false
		};
	},
	mounted() {
		EventBus.$on('showModal', this.showModal);
		EventBus.$on('showComponentModal', this.showComponentModal);
		EventBus.$on('closeModal', this.close);
	},
	methods: {
		show() {
			this.shown = true;
		},

		close() {
			this.shown = false;
			EventBus.$emit('modalClosed');
		},

		possiblyClose(event) {
			if(event.target == document.getElementById('modal')) {
				this.close();
			}
		},

		initCommonModal(title) {
			this.title = title;
			this.message = null;
			this.html = null;
			this.compname = null;
			this.props = null;
		},

		initTextModal(title, body) {
			this.initCommonModal(title);
			this.message = body;
		},

		initHtmlModal(title, body) {
			this.initCommonModal(title);
			this.html = body;
		},

		initComponentModal(title, compname, props) {
			this.initCommonModal(title);
			this.compname = compname;
			this.props = props;
		},

		showModal(title, data, html = false) {
			if (typeof data === 'string') {
				if (html) {
					this.initHtmlModal(title, data);
				}
				else {
					this.initTextModal(title, data);
				}
				this.show();
			}
			else {
				this.showComponentModal(title, 'ObjectTree', {data: data});
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
    z-index: 9000; /* Snotify has 9999 and is intentionally above the modals */
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
