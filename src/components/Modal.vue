<template>
	<div id="modal" v-if="shown" @mousedown="possiblyClose">
		<div class="modal-container" :style="{'min-width': minWidth, 'max-width': maxWidth}">
			<header>
				<h2>{{ title }}</h2>
				<span class="close" @click="close"><i class="fa fa-times" aria-hidden="true"></i></span>
			</header>
			<main>
				<slot name="main">
					<div v-if="typeof html === 'string'" v-html="html"></div>
					<div v-else-if="html !== null && typeof html === 'object'" v-html="html.innerHTML"></div>
					<template v-else-if="list !== null">
						<strong class="listEmpty" v-if="listCount == 0">Sorry, no data available.</strong>
						<ul class="list" v-else>
							<li v-for="(item, key) in listItems" :key="key" @click="doMainListAction(item, key)">
								<strong>{{ Array.isArray(listItems) ? item : key }}</strong>
								<button type="button" v-for="action in otherListActions" :key="action.icon" :title="action.title" @click.prevent.stop="doListAction(item, key, action.callback)">
									<i :class="'fas fa-'+action.icon"></i>
								</button>
							</li>
						</ul>
					</template>
					<template v-else>{{ message }}</template>
				</slot>
			</main>
			<footer>
				<slot name="footer"></slot>
			</footer>
		</div>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';
import Utils from '../utils.js';

const getDefaultState = () => {
	return {
		title: 'Sorry, no message passed!',
		message: null,
		html: null,
		list: null,
		listActions: [],
		shown: false,
		onClose: null
	};
};

export default {
	name: 'Modal',
	props: {
		minWidth: {
			type: String,
			default: "30%"
		},
		maxWidth: {
			type: String,
			default: "80%"
		}
	},
	data() {
		return getDefaultState();
	},
	mounted() {
		EventBus.$on('showModal', this.showModal);
		EventBus.$on('closeModal', this.close);
	},
    computed: {
		listCount() {
			return Utils.size(this.listItems);
		},
        listItems() {
            return (typeof this.list == 'function' ? this.list() : this.list);
		},
		otherListActions() {
			return Array.isArray(this.listActions) && this.listActions.length > 1 ? this.listActions.slice(1) : [];
		}
    },
	methods: {
		escCloseListener(event) {
			if (event.key == "Escape") { 
				this.close();
				event.preventDefault();
				event.stopPropagation();
				return false;
			}
		},

		show(title, onClose = null) {
			this.reset();
			this._show(title, onClose);
		},

		showMessage(title, message, onClose = null) {
			this.reset();
			this.message = message;
			this._show(title, onClose);
		},

		showHtml(title, html, onClose = null) {
			this.reset();
			this.html = html;
			this._show(title, onClose);
		},

		showList(title, list, actions, onClose = null) {
			this.reset();
			this.list = list;
			this.listActions = actions;
			this._show(title, onClose);
		},

		_show(title, onClose) {
			this.onClose = onClose;
			this.title = title;
			window.addEventListener('keydown', this.escCloseListener);
			this.shown = true;
		},

		reset() {
			Object.assign(this, getDefaultState());
		},

		close() {
			if (typeof this.onClose === 'function' && !this.onClose()) {
				return;
			}
			this.shown = false;
			window.removeEventListener('keydown', this.escCloseListener);
		},

		possiblyClose(event) {
			if(event.target == document.getElementById('modal')) {
				this.close();
			}
		},
		
        doListAction(item, key, callback) {
            const closeAfterCompletion = callback(Array.isArray(this.listItems) ? item : key);
            if(closeAfterCompletion === true) {
                this.close();
            }
		},

        doMainListAction(item, key) {
            if(this.listActions.length > 0) {
                this.doListAction(item, key, this.listActions[0].callback);
            }
        }
	}
};
</script>

<style>
#modal {
    position: fixed;
    z-index: 9000; /* Snotify has 9999 and is intentionally above the modals */
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.4);
	display: flex;
	justify-content: center;
	align-items: center;
}

#modal .modal-container {
    background-color: #fff;
    border: 1px solid #fff;
	max-height: 96%;
	display: flex;
	flex-direction: column;
	box-shadow: 8px 8px 8px 0px rgba(0,0,0,0.3);
}

#modal header {
	background-color: #1665B6;
	color: white;
	margin: 0;
	height: 1.5rem;
	padding: 1rem;
	display: flex;
	align-items: center;
}

#modal header h2 {
	display: inline-block;
	flex-grow: 1;
	margin: 0;
	font-size: 1.5rem;
}

#modal main {
    padding: 1rem;
	overflow: auto;
	flex-grow: 1;
}

#modal .inline main {
	padding: 0;
}

#modal footer:empty {
	display: none;
}

#modal footer {
	background-color: #eee;
	margin: 0;
	padding: 1rem;
}

#modal .close {
	font-size: 1.5rem;
	height: 2rem;
	width: 2rem;
    color: white;
    cursor: pointer;
	display: flex;
	justify-content: center;
	align-items: center;
}

#modal .close:hover, #modal .close:focus {
    color: red;
}

#modal .list {
	list-style-type: none;
	margin: 0;
	padding: 0;
	border: 1px solid #ccc;
}

#modal .list li:first-of-type {
	border: 0;
}
#modal .list li {
	cursor: pointer;
	display: block;
	border-top: 1px solid #ccc;
	padding: 0.5rem;
	color: #1665B6;
	display: flex;
	align-items: center;
}
#modal .list li:hover {
	color: black;
	background-color: #eee;
}
#modal .list li strong {
	flex-grow: 1;
	font-weight: normal;
}
#modal .listEmpty {
    display: block;
    text-align: center;
}
</style>
