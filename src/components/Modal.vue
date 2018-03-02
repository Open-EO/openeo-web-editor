<template>
<div id="modal" class="modal">
	<div class="modal-container">
		<h2 class="modal-header">
			{{ title }}
			<span class="close">&times;</span>
		</h2>
		<div class="modal-content" id="modal-content"></div>
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
			body: null
		};
	},
	mounted() {
		EventBus.$on('showModal', this.show);
	},
	methods: {
		show(title, body) {
			this.title = title;

			var modal = document.getElementById('modal');
			modal.style.display = "block";
			var span = document.getElementsByClassName("close")[0];
			span.onclick = function() {
				modal.style.display = "none";
			}
			if (typeof body === 'object') {
				body = this.makeList(body);
			}
			document.getElementById('modal-content').innerHTML = body;
			window.onclick = function(event) {
				if (event.target == modal) {
					modal.style.display = "none";
				}
			}
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
    display: none;
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

