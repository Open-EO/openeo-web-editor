<template>
	<Modal :show="show" :title="title" @closed="$emit('closed')">
		<strong class="listEmpty" v-if="listCount == 0">No data available.</strong>
		<ul class="modal-list" v-else>
			<li v-for="(item, key) in listItems" :key="key" @click="doMainListAction(item, key)">
				<strong>{{ Array.isArray(listItems) ? item : key }}</strong>
				<button type="button" v-for="action in otherListActions" :key="action.icon" :title="action.title" @click.prevent.stop="doListAction(item, key, action.callback)">
					<i :class="'fas fa-'+action.icon"></i>
				</button>
			</li>
		</ul>
	</Modal>
</template>

<script>
import Utils from '../../utils.js';
import Modal from './Modal.vue';

export default {
	name: 'ListModal',
	components: {
		Modal
	},
	props: {
		title: {
			type: String,
			default: null
		},
		list: {
			type: Array,
			default: () => ([])
		},
		listActions: {
			type: Array,
			default: () => ([])
		}
	},
	data() {
		return {
			show: true
		};
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
		async doListAction(item, key, callback) {
			const closeAfterCompletion = await callback(item, key);
			if(closeAfterCompletion === true) {
				this.show = false;
			}
		},
		async doMainListAction(item, key) {
			if(this.listActions.length > 0) {
				await this.doListAction(item, key, this.listActions[0].callback);
			}
		}
	}
};
</script>

<style scoped lang="scss">
.modal-list {
	list-style-type: none;
	margin: 0;
	padding: 0;
	border: 1px solid #ccc;

	 li {
		cursor: pointer;
		display: block;
		border-top: 1px solid #ccc;
		padding: 0.5rem;
		color: #1665B6;
		display: flex;
		align-items: center;

		&:first-of-type {
			border: 0;
		}
		&:hover {
			color: black;
			background-color: #eee;
		}

		strong {
			flex-grow: 1;
			font-weight: normal;
		}
	}
}

.listEmpty {
		display: block;
		text-align: center;
}
</style>
