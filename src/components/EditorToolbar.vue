<template>
	<div class="sourceHeader">
		<h3 v-if="contextTitle">{{ contextTitle }}</h3>
		<div class="sourceToolbar">
			<span class="sepr" v-if="editable">
				<button type="button" @click="newScript" title="New script / Clear current script"><i class="fas fa-file"></i></button>
				<button type="button" v-show="contextTitle" @click="saveScript" :title="'Save to ' + contextTitle"><i class="fas fa-save"></i></button>
			</span>
			<slot></slot>
		</div>
	</div>
</template>

<script>
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import Utils from '../utils.js';

export default {
	name: 'EditorToolbar',
	mixins: [EventBusMixin],
	props: {
		editable: {
			type: Boolean,
			default: true
		},
		onClear: {
			type: Function,
			required: true
		}
	},
	computed: {
		...Utils.mapState(['connection']),
		...Utils.mapState('editor', ['context', 'process']),
		...Utils.mapGetters('editor', ['contextTitle']),
		...Utils.mapGetters(['supports', 'isAuthenticated'])
	},
	methods: {
		...Utils.mapMutations('editor', ['setContext']),

		newScript() {
			var confirmed = confirm("Do you really want to clear the existing script to create a new one?");
			if (confirmed) {
				this.onClear();
				this.setContext(null);
			}
		},

		saveScript() {
			this.emit('replaceProcess', this.context, this.process);
		}
	}
}
</script>


<style>
.sourceHeader {
	padding: 5px;
	border-bottom: 1px solid #ddd;
	display: flex;
	justify-content: flex-end;
	background-color: #fff;
}
.sourceHeader h3 {
	margin: auto 0;
	flex-grow: 1;
}
.sourceToolbar {
	text-align: right;
}
</style>
