<template>
	<div class="modal" @mousedown="backgroundClose" :style="{'z-index': zIndex}">
		<div ref="container" class="modal-container" :style="style">
			<header class="modal-header" @mousedown="startMove">
				<slot name="header">
					<h2>{{ title }}</h2>
					<span class="close" @click="close"><i class="fa fa-times" aria-hidden="true"></i></span>
				</slot>
			</header>
			<main class="modal-content">
				<slot></slot>
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

export default {
	name: 'Modal',
	mixins: [EventBusMixin],
	props: {
		title: {
			type: String,
			default: null
		},
		minWidth: {
			type: String,
			default: null
		},
		width: {
			type: String,
			default: "auto"
		},
		show: {
			type: Boolean,
			default: true
		}
	},
	data() {
		return {
			zIndex: 1000,
			position: null,
			dragPosition: null
		};
	},
    computed: {
		...Utils.mapState('editor', ['hightestModalZIndex']),
		style() {
			let style = {
				'width': this.width
			};
			if (this.minWidth) {
				style['min-width'] = this.minWidth;
			}
			if (Array.isArray(this.position)) {
				style.position = 'absolute';
				style.left = this.position[0] + 'px';
				style.top = this.position[1] + 'px';
			}
			return style;
		}
    },
	watch: {
		show: {
			immediate: true,
			handler(show) {
				if (!show) {
					this.close();
				}
				else {
					this.open();
				}
			}
		}
	},
	methods: {
		...Utils.mapMutations('editor', ['openModal', 'closeModal']),
		open() {
			this.openModal();
			this.zIndex = this.hightestModalZIndex;
			window.addEventListener('keydown', this.escCloseListener);
			this.$emit('shown');
		},
		close() {
			window.removeEventListener('keydown', this.escCloseListener);
			this.closeModal();
			this.$emit('closed');
		},
		startMove(event) {
			if (event.target.tagName !== 'H2') {
				this.dragPosition = [
					event.clientX,
					event.clientY
				];

				document.addEventListener('mousemove', this.move);
				document.addEventListener('mouseup', this.stopMove);

				event.preventDefault();
				event.stopPropagation();
			}
		},
		stopMove() {
			document.removeEventListener('mousemove', this.move);
			document.removeEventListener('mouseup', this.stopMove);
		},
		move(event) {
      		event.preventDefault();
			// set the element's new position
			this.position = [
				this.$refs.container.offsetLeft - (this.dragPosition[0] - event.clientX),
				this.$refs.container.offsetTop - (this.dragPosition[1] - event.clientY)
			];
			// Store for later
			this.dragPosition = [
				event.clientX,
				event.clientY
			];
		},
		escCloseListener(event) {
			if (event.key == "Escape") { 
				this.close();
				event.preventDefault();
				event.stopPropagation();
				return false;
			}
		},
		backgroundClose(event) {
			if (event.target === this.$el) {
				this.close();
			}
		}
	}
};
</script>

<style lang="scss">
@import '../../../theme.scss';

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
	min-height: 50vh;
	min-width: 300px;
	width: 70%;
	max-height: 96%;
	max-width: 96%;
	display: flex;
	flex-direction: column;
	box-shadow: 8px 8px 8px 0px rgba(0,0,0,0.3);
	resize: both;
	overflow: hidden;
}

.modal .modal-header {
	background-color: $mainColor;
	color: white;
	margin: 0;
	height: 1.5rem;
	padding: 1rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
    cursor: move;
}

.modal .modal-header h2 {
	display: inline-block;
	margin: 0;
	margin-left: -0.5rem;
	padding: 0.5rem;
	font-size: 1.5rem;
	border: 0;
	cursor: text;
	text-overflow: ellipsis;
    overflow: hidden;
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
</style>
