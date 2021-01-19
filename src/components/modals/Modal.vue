<template>
	<div class="modal" ref="modal" v-if="shown" @mousedown="possiblyClose" :style="{'z-index': zIndex}">
		<div ref="container" class="modal-container" :style="{'min-width': minWidth, 'max-width': maxWidth, 'min-height': minHeight}">
			<header class="modal-header" @mousedown.prevent.stop="startMove">
				<slot name="header">
					<h2>{{ title }}</h2>
					<span class="close" @click="close"><i class="fa fa-times" aria-hidden="true"></i></span>
				</slot>
			</header>
			<main class="modal-content">
				<slot name="main">
					<template v-if="list !== null">
						<strong class="listEmpty" v-if="listCount == 0">Sorry, no data available.</strong>
						<ul class="modal-list" v-else>
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
			<footer class="modal-footer">
				<slot name="footer"></slot>
			</footer>
		</div>
	</div>
</template>

<script>
import EventBusMixin from '../EventBusMixin.vue';
import Utils from '../../utils.js';

const getDefaultState = () => {
	return {
		title: 'Sorry, no message passed!',
		message: null,
		list: null,
		listActions: [],
		shown: false,
		onClose: null,
		zIndex: 1000,
		drag: {
			mousemove: null,
			mouseup: null,
			clientX: undefined,
			clientY: undefined,
			movementX: 0,
			movementY: 0
		}
	};
};

export default {
	name: 'Modal',
	mixins: [EventBusMixin],
	props: {
		minWidth: {
			type: String,
			default: "30%"
		},
		maxWidth: {
			type: String,
			default: "85%"
		},
		minHeight: {
			type: String,
			default: "auto"
		}
	},
	data() {
		return getDefaultState();
	},
    computed: {
		...Utils.mapState('editor', ['hightestModalZIndex']),
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
		...Utils.mapMutations('editor', ['openModal', 'closeModal']),

		startMove(event) {
			this.drag.clientX = event.clientX;
			this.drag.clientY = event.clientY;

			this.drag.mousemove = this.move.bind(this);
			document.addEventListener('mousemove', this.drag.mousemove);
			this.drag.mouseup = this.stopMove.bind(this);
			document.addEventListener('mouseup', this.drag.mouseup);
		},

		stopMove(event) {
			document.removeEventListener('mousemove', this.drag.mousemove);
			document.removeEventListener('mouseup', this.drag.mouseup);
		},

		move(event) {
      		event.preventDefault();
			this.drag.movementX = this.drag.clientX - event.clientX;
			this.drag.movementY = this.drag.clientY - event.clientY;
			this.drag.clientX = event.clientX;
			this.drag.clientY = event.clientY;
			// set the element's new position:
			this.$refs.container.style.position = 'absolute';
			this.$refs.container.style.top = (this.$refs.container.offsetTop - this.drag.movementY) + 'px';
			this.$refs.container.style.left = (this.$refs.container.offsetLeft - this.drag.movementX) + 'px'
		},

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

		showList(title, list, actions, onClose = null) {
			this.reset();
			this.list = list;
			this.listActions = actions;
			this._show(title, onClose);
		},

		_show(title, onClose) {
			this.onClose = onClose;
			this.title = title;
			this.openModal();
			this.zIndex = this.hightestModalZIndex;
			window.addEventListener('keydown', this.escCloseListener);
			this.shown = true;
			this.$nextTick(() => this.$emit('shown'));
		},

		reset() {
			Object.assign(this, getDefaultState());
		},

		close() {
			if (typeof this.onClose === 'function' && !this.onClose()) {
				return;
			}
			this.shown = false;
			this.closeModal();
			this.$emit('closed');
			window.removeEventListener('keydown', this.escCloseListener);
		},

		possiblyClose(event) {
			if(event.target == this.$refs.modal) {
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
.modal {
    position: fixed;
    z-index: 1000; /* Snotify has 9999 and is intentionally above the modals */
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.4);
	display: flex;
	justify-content: center;
	align-items: center;
}

.modal .modal-container {
    background-color: #fff;
    border: 1px solid #fff;
	max-height: 96%;
	display: flex;
	flex-direction: column;
	box-shadow: 8px 8px 8px 0px rgba(0,0,0,0.3);
}

.modal .modal-header {
	background-color: #1665B6;
	color: white;
	margin: 0;
	height: 1.5rem;
	padding: 1rem;
	display: flex;
	align-items: center;
    cursor: move;
}

.modal .modal-header h2 {
	display: inline-block;
	flex-grow: 1;
	margin: 0;
	font-size: 1.5rem;
}

.modal .modal-content {
    padding: 1rem;
	overflow: auto;
	flex-grow: 1;
}

.modal .inline .modal-content {
	padding: 0;
}

.modal .modal-footer:empty {
	display: none;
}

.modal .modal-footer {
	background-color: #eee;
	margin: 0;
	padding: 1rem;
}

.modal .close {
	font-size: 1.5rem;
	height: 2rem;
	width: 2rem;
    color: white;
    cursor: pointer;
	display: flex;
	justify-content: center;
	align-items: center;
}

.modal .close:hover, .modal .close:focus {
    color: red;
}

.modal .modal-list {
	list-style-type: none;
	margin: 0;
	padding: 0;
	border: 1px solid #ccc;
}

.modal .modal-list li:first-of-type {
	border: 0;
}
.modal .modal-list li {
	cursor: pointer;
	display: block;
	border-top: 1px solid #ccc;
	padding: 0.5rem;
	color: #1665B6;
	display: flex;
	align-items: center;
}
.modal .modal-list li:hover {
	color: black;
	background-color: #eee;
}
.modal .modal-list li strong {
	flex-grow: 1;
	font-weight: normal;
}
.modal .listEmpty {
    display: block;
    text-align: center;
}
</style>
