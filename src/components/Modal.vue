<template>
<div id="modal" class="modal" v-if="shown" @click="possiblyClose">
	<div class="modal-container">
		<h2 class="modal-header">
			{{ title }}
			<span class="close" @click="close">&times;</span>
		</h2>
		<div class="modal-content" id="modal-content" v-html="body">
		</div>
	</div>
</div>
</template>

<script>
import EventBus from '../eventbus.js';

export default {
	name: 'Modal',
	data() {
		return {
			title: null,
			body: null,
			shown: false
		};
	},
	mounted() {
		EventBus.$on('showModal', this.setDataAndShow);
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

		setData(title, body) {
			this.title = title;
			this.body = (typeof body === 'object' ? this.makeList(body) : body);
		},

		setDataAndShow(title, body) {
			this.setData(title, body);
			this.show();
		},

		makeList(data, level) {
			
			var items = [];
			var callback = (val, key) => {
				var type = typeof val;
				if (type === "array" || type === "object") {
					val = this.makeList(val, level ? level+1 : 1);
				}
				if (key && (!this.isNumeric(key) || level > 0 || type !== 'string')) {
					val = "<em>" + key + "</em>: " + val;
				}
				items.push("<li>" + val + "</li>");
			};
			for (var key in data) {
				callback(data[key], key);
			}
			return "<ul>" + items.join("") + "</ul>";
		},

		isNumeric(n) {
			return !isNaN(parseFloat(n)) && isFinite(n);
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

